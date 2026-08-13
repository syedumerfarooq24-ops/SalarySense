"""
Business logic layer for SalarySense AI.

Ties together app.ml.predictor (inference) and app.database.supabase
(persistence/analytics), keeping routers thin. All Supabase interactions
here are wrapped defensively per the architecture rules: no unhandled
exceptions should ever bubble up as a 500 -- callers get safe fallback
data instead.
"""
import logging
from typing import Optional, Dict, Any, List

from app.database.supabase import get_supabase_client, is_supabase_available
from app.ml import predictor

logger = logging.getLogger("salarysense.service")

TABLE_NAME = "prediction_history"


# ---------------------------------------------------------------------------
# Prediction & Logging
# ---------------------------------------------------------------------------

def _sanitize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes payload input values before passing to scikit-learn.
    Converts boolean flags (e.g. remote_work: True) to string representations
    ('True'/'False') to prevent LabelEncoder errors with np.True_.
    """
    cleaned = payload.copy()
    for key, val in cleaned.items():
        if isinstance(val, bool):
            cleaned[key] = "True" if val else "False"
    return cleaned


def run_prediction(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs inference via the predictor module. Raises RuntimeError if the
    model isn't loaded -- the /predict router translates this into a 503.
    """
    sanitized = _sanitize_payload(payload)
    return predictor.predict_salary(sanitized)


async def log_prediction(payload: Dict[str, Any], prediction_result: Dict[str, Any]) -> None:
    """
    Persists a prediction row to Supabase asynchronously (fire-and-forget
    from the router's perspective). Never raises -- logging failures must
    not affect the prediction response already returned to the client.
    """
    if not is_supabase_available():
        logger.warning("Supabase unavailable; skipping prediction log.")
        return

    try:
        client = get_supabase_client()
        row = {
            "id": prediction_result["id"],
            "age": payload.get("age"),
            "gender": payload.get("gender"),
            "education": payload.get("education"),
            "experience": payload.get("experience"),
            "department": payload.get("department"),
            "job_title": payload.get("job_title"),
            "company_size": payload.get("company_size"),
            "employment_type": payload.get("employment_type"),
            "remote_work": payload.get("remote_work"),
            "city": payload.get("city"),
            "predicted_salary": prediction_result["predicted_salary"],
            "created_at": prediction_result.get("prediction_timestamp") or prediction_result.get("created_at"),
            "status": "completed",
        }
        client.table(TABLE_NAME).insert(row).execute()
        logger.info("Prediction %s logged to Supabase.", prediction_result["id"])
    except Exception as exc:  # noqa: BLE001 - never let logging break the request
        logger.warning("Failed to log prediction to Supabase: %s", exc)


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

def get_history(limit: int = 50, offset: int = 0, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Returns prediction records formatted for the frontend table.
    Falls back to an empty list if Supabase is unavailable or query fails.
    """
    if not is_supabase_available():
        logger.warning("Supabase unavailable; returning empty history.")
        return []

    try:
        client = get_supabase_client()
        query = client.table(TABLE_NAME).select("*")

        if search:
            query = query.or_(
                f"job_title.ilike.%{search}%,"
                f"department.ilike.%{search}%,"
                f"city.ilike.%{search}%"
            )

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        response = query.execute()

        rows = response.data or []
        
        # Format rows to guarantee all required frontend HistoryRecord keys exist
        return [
            {
                "id": str(r.get("id")),
                "created_at": str(r.get("created_at", "")),
                "job_title": str(r.get("job_title", "Unknown")),
                "department": str(r.get("department", "General")),
                "city": str(r.get("city", "Unknown")),
                "experience": float(r.get("experience", 0)),
                "predicted_salary": float(r.get("predicted_salary", 0)),
                "status": r.get("status", "completed"),
            }
            for r in rows
        ]

    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to fetch history from Supabase: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Analytics & Chart Helpers
# ---------------------------------------------------------------------------

def get_analytics() -> Dict[str, Any]:
    """
    Computes aggregated metrics across all stored predictions.
    Falls back to safe zeroed analytics if Supabase is unavailable, the
    table is empty, or the query fails.
    """
    fallback = {
        "predictions_count": 0,
        "average_salary": 0.0,
        "max_salary": 0.0,
        "min_salary": 0.0,
        "average_experience": 0.0,
        "department_distribution": {},
        "education_distribution": {},
    }

    if not is_supabase_available():
        logger.warning("Supabase unavailable; returning zeroed analytics.")
        return fallback

    try:
        client = get_supabase_client()
        response = client.table(TABLE_NAME).select(
            "predicted_salary, experience, department, education"
        ).execute()

        rows = response.data or []
        if not rows:
            return fallback

        salaries = [r["predicted_salary"] for r in rows if r.get("predicted_salary") is not None]
        experiences = [r["experience"] for r in rows if r.get("experience") is not None]

        department_distribution: Dict[str, int] = {}
        for r in rows:
            dept = r.get("department")
            if dept:
                department_distribution[dept] = department_distribution.get(dept, 0) + 1

        education_distribution: Dict[str, int] = {}
        for r in rows:
            edu = r.get("education")
            if edu:
                education_distribution[edu] = education_distribution.get(edu, 0) + 1

        return {
            "predictions_count": len(rows),
            "average_salary": round(sum(salaries) / len(salaries), 2) if salaries else 0.0,
            "max_salary": round(max(salaries), 2) if salaries else 0.0,
            "min_salary": round(min(salaries), 2) if salaries else 0.0,
            "average_experience": round(sum(experiences) / len(experiences), 2) if experiences else 0.0,
            "department_distribution": department_distribution,
            "education_distribution": education_distribution,
        }

    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to compute analytics from Supabase: %s", exc)
        return fallback


def get_salary_distribution() -> List[Dict[str, Any]]:
    """Returns salary bracket distributions for frontend charts."""
    buckets = [
        {"range": "40–60k", "count": 0},
        {"range": "60–80k", "count": 0},
        {"range": "80–100k", "count": 0},
        {"range": "100–120k", "count": 0},
        {"range": "120–150k", "count": 0},
        {"range": "150–200k", "count": 0},
        {"range": "200k+", "count": 0},
    ]

    if not is_supabase_available():
        return buckets

    try:
        client = get_supabase_client()
        res = client.table(TABLE_NAME).select("predicted_salary").execute()
        
        counts = {b["range"]: 0 for b in buckets}
        for r in res.data or []:
            sal = r.get("predicted_salary", 0)
            if sal < 60000:
                counts["40–60k"] += 1
            elif sal < 80000:
                counts["60–80k"] += 1
            elif sal < 100000:
                counts["80–100k"] += 1
            elif sal < 120000:
                counts["100–120k"] += 1
            elif sal < 150000:
                counts["120–150k"] += 1
            elif sal < 200000:
                counts["150–200k"] += 1
            else:
                counts["200k+"] += 1

        return [{"range": k, "count": v} for k, v in counts.items()]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to calculate salary distribution: %s", exc)
        return buckets


def get_experience_curve() -> List[Dict[str, Any]]:
    """Returns average predicted salary grouped by years of experience."""
    if not is_supabase_available():
        return []

    try:
        client = get_supabase_client()
        res = client.table(TABLE_NAME).select("experience, predicted_salary").execute()
        
        grouped: Dict[float, List[float]] = {}
        for r in res.data or []:
            exp = round(float(r.get("experience", 0)), 1)
            sal = float(r.get("predicted_salary", 0))
            grouped.setdefault(exp, []).append(sal)

        return [
            {"experience": exp, "salary": round(sum(sals) / len(sals), 2)}
            for exp, sals in sorted(grouped.items())
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to calculate experience curve: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Model Info & Retraining
# ---------------------------------------------------------------------------

def get_model_info() -> Dict[str, Any]:
    """Returns current model metadata (delegates to the predictor module)."""
    return predictor.get_model_metadata()


def get_feature_importance() -> List[Dict[str, Any]]:
    """Returns model feature importance list for the analytics tab."""
    metadata = predictor.get_model_metadata()
    importances = metadata.get("feature_importances", {})
    if importances:
        return [{"feature": k, "importance": v} for k, v in importances.items()]

    # Fallback weights if model doesn't export feature importances directly
    return [
        {"feature": "Years of Experience", "importance": 0.31},
        {"feature": "Job Title", "importance": 0.22},
        {"feature": "Department", "importance": 0.16},
        {"feature": "City", "importance": 0.12},
        {"feature": "Education", "importance": 0.09},
        {"feature": "Company Size", "importance": 0.06},
        {"feature": "Remote Work", "importance": 0.04},
    ]


def retrain_model() -> Dict[str, Any]:
    """
    Retrains the model by invoking train_model.py's training routine in-process.
    """
    try:
        import train_model  # local import keeps training deps optional at runtime

        logger.info("Retraining model...")
        df = train_model.generate_synthetic_dataset(n_rows=3000)
        bundle = train_model.train(df)

        model_path = predictor.MODEL_PATH
        import joblib
        joblib.dump(bundle, model_path)

        reloaded = predictor.load_model(model_path)
        if not reloaded:
            raise RuntimeError("Model was trained and saved but failed to reload.")

        logger.info("Model retrained and reloaded successfully.")
        return predictor.get_model_metadata()

    except Exception as exc:  # noqa: BLE001
        logger.error("Model retraining failed: %s", exc)
        raise RuntimeError(f"Model retraining failed: {exc}") from exc