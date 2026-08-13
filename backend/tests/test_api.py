"""
Test suite for SalarySense AI backend.

Covers:
- API endpoints via FastAPI's TestClient (health, predict, history,
  analytics, model-info, train)
- Graceful-fallback behavior when Supabase is unavailable
- Service-layer logic with mocked Supabase client (to verify query
  construction without needing a live database)

Run with: pytest -v
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.ml import predictor
from app.services import salary_service

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

def test_health_check_returns_200():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert "model_loaded" in body


# ---------------------------------------------------------------------------
# Predict
# ---------------------------------------------------------------------------

VALID_PAYLOAD = {
    "age": 30,
    "gender": "Male",
    "education": "Bachelors",
    "experience": 5,
    "department": "Engineering",
    "job_title": "Software Engineer",
    "company_size": "Large",
    "employment_type": "Full-time",
    "remote_work": "Hybrid",
    "city": "Karachi",
}


def test_predict_returns_503_when_model_not_loaded():
    with patch.object(predictor, "_model", None):
        response = client.post("/predict", json=VALID_PAYLOAD)
        assert response.status_code == 503
        assert "detail" in response.json()


def test_predict_rejects_invalid_payload():
    bad_payload = dict(VALID_PAYLOAD)
    del bad_payload["age"]  # missing required field
    response = client.post("/predict", json=bad_payload)
    assert response.status_code == 422


def test_predict_rejects_unknown_fields():
    bad_payload = dict(VALID_PAYLOAD)
    bad_payload["unexpected_field"] = "value"
    response = client.post("/predict", json=bad_payload)
    assert response.status_code == 422


def test_predict_succeeds_with_mocked_model():
    fake_model = MagicMock()
    fake_model.predict.return_value = [75000.0]

    with patch.object(predictor, "_model", fake_model):
        response = client.post("/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200
        body = response.json()
        assert body["predicted_salary"] == 75000.0
        assert "id" in body
        assert "prediction_timestamp" in body
        assert "confidence_score" in body


# ---------------------------------------------------------------------------
# History (graceful fallback, no Supabase configured)
# ---------------------------------------------------------------------------

def test_history_returns_empty_fallback_without_supabase():
    with patch("app.services.salary_service.is_supabase_available", return_value=False):
        response = client.get("/history")
        assert response.status_code == 200
        body = response.json()
        assert body["records"] == []
        assert body["total"] == 0


def test_history_respects_limit_and_offset_params():
    with patch("app.services.salary_service.is_supabase_available", return_value=False):
        response = client.get("/history?limit=10&offset=5")
        assert response.status_code == 200
        body = response.json()
        assert body["limit"] == 10
        assert body["offset"] == 5


def test_history_rejects_out_of_range_limit():
    response = client.get("/history?limit=1000")
    assert response.status_code == 422


def test_history_survives_supabase_exception():
    mock_client = MagicMock()
    mock_client.table.side_effect = Exception("connection refused")

    with patch("app.services.salary_service.is_supabase_available", return_value=True), \
         patch("app.services.salary_service.get_supabase_client", return_value=mock_client):
        response = client.get("/history")
        assert response.status_code == 200
        assert response.json()["records"] == []


# ---------------------------------------------------------------------------
# Analytics (graceful fallback, no Supabase configured)
# ---------------------------------------------------------------------------

def test_analytics_returns_zeroed_fallback_without_supabase():
    with patch("app.services.salary_service.is_supabase_available", return_value=False):
        response = client.get("/analytics")
        assert response.status_code == 200
        body = response.json()
        assert body["predictions_count"] == 0
        assert body["average_salary"] == 0.0
        assert body["department_distribution"] == {}
        assert body["education_distribution"] == {}


def test_analytics_computes_aggregates_from_mocked_rows():
    mock_response = MagicMock()
    mock_response.data = [
        {"predicted_salary": 50000, "experience": 2, "department": "Engineering", "education": "Bachelors"},
        {"predicted_salary": 70000, "experience": 4, "department": "Engineering", "education": "Masters"},
        {"predicted_salary": 90000, "experience": 6, "department": "Sales", "education": "Masters"},
    ]

    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.execute.return_value = mock_response

    with patch("app.services.salary_service.is_supabase_available", return_value=True), \
         patch("app.services.salary_service.get_supabase_client", return_value=mock_client):
        response = client.get("/analytics")
        assert response.status_code == 200
        body = response.json()
        assert body["predictions_count"] == 3
        assert body["average_salary"] == 70000.0
        assert body["max_salary"] == 90000.0
        assert body["min_salary"] == 50000.0
        assert body["department_distribution"] == {"Engineering": 2, "Sales": 1}
        assert body["education_distribution"] == {"Bachelors": 1, "Masters": 2}


def test_analytics_survives_supabase_exception():
    mock_client = MagicMock()
    mock_client.table.side_effect = Exception("timeout")

    with patch("app.services.salary_service.is_supabase_available", return_value=True), \
         patch("app.services.salary_service.get_supabase_client", return_value=mock_client):
        response = client.get("/analytics")
        assert response.status_code == 200
        assert response.json()["predictions_count"] == 0


# ---------------------------------------------------------------------------
# Model Info
# ---------------------------------------------------------------------------

def test_model_info_returns_valid_shape():
    response = client.get("/model-info")
    assert response.status_code == 200
    body = response.json()
    for key in ["algorithm", "r2_score", "dataset_size", "features", "version", "mae", "mse", "rmse"]:
        assert key in body


def test_model_info_reflects_zeroed_defaults_when_unloaded():
    fake_metadata = {
        "algorithm": "Unknown",
        "r2_score": 0.0,
        "dataset_size": 0,
        "features": [],
        "version": "1.0.0",
        "mae": 0.0,
        "mse": 0.0,
        "rmse": 0.0,
    }
    with patch.object(predictor, "_model_metadata", fake_metadata):
        response = client.get("/model-info")
        assert response.status_code == 200
        assert response.json()["algorithm"] == "Unknown"


# ---------------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------------

def test_train_endpoint_retrains_and_reloads(tmp_path):
    """
    Runs a real (small) training cycle against a temp model path to keep
    the test fast, verifying the endpoint's happy path end-to-end without
    touching the real salary_model.pkl on disk.
    """
    import train_model as tm

    small_df = tm.generate_synthetic_dataset(n_rows=200)

    def fake_retrain():
        bundle = tm.train(small_df)
        model_path = str(tmp_path / "test_model.pkl")
        import joblib
        joblib.dump(bundle, model_path)
        predictor.load_model(model_path)
        return predictor.get_model_metadata()

    with patch("app.services.salary_service.retrain_model", side_effect=fake_retrain):
        response = client.post("/train")
        assert response.status_code == 200
        body = response.json()
        assert body["algorithm"] == "RandomForestRegressor"
        assert body["dataset_size"] == 200


def test_train_endpoint_returns_500_on_failure():
    with patch(
        "app.services.salary_service.retrain_model",
        side_effect=RuntimeError("Model retraining failed: disk full"),
    ):
        response = client.post("/train")
        assert response.status_code == 500
        assert "disk full" in response.json()["detail"]


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

def test_cors_allows_configured_origin():
    response = client.options(
        "/history",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
