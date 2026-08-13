"""
ML model loading and inference wrapper for SalarySense AI.

Loads `salary_model.pkl` (a scikit-learn Pipeline, ideally) via joblib.
Provides safe accessors so routers/services never crash the app if the
model file is missing, corrupted, or fails to load — they get a clear
"model unavailable" signal instead of an unhandled exception.
"""
import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("salarysense.ml")

MODEL_PATH = os.getenv("MODEL_PATH", "salary_model.pkl")

# Feature columns the model expects, in order. Must match train_model.py
# and PredictionPayload in app/schemas/salary.py (minus the target).
FEATURE_COLUMNS = [
    "age",
    "gender",
    "education",
    "experience",
    "department",
    "job_title",
    "company_size",
    "employment_type",
    "remote_work",
    "city",
]

_model = None
_model_metadata: Dict[str, Any] = {
    "algorithm": "Unknown",
    "r2_score": 0.0,
    "dataset_size": 0,
    "features": FEATURE_COLUMNS,
    "version": os.getenv("APP_VERSION", "1.0.0"),
    "mae": 0.0,
    "mse": 0.0,
    "rmse": 0.0,
}


def load_model(model_path: Optional[str] = None) -> bool:
    """
    Attempts to load the trained model (and its metadata, if bundled)
    from disk. Returns True on success, False on any failure — never
    raises, so this is safe to call at app startup.
    """
    global _model, _model_metadata

    path = model_path or MODEL_PATH

    try:
        if not os.path.exists(path):
            logger.warning("Model file not found at '%s'. Predictions disabled.", path)
            _model = None
            return False

        loaded = joblib.load(path)

        # Support either a bare estimator/pipeline, or a dict bundle
        # containing {"model": ..., "metadata": {...}} produced by
        # train_model.py in a later step.
        if isinstance(loaded, dict) and "model" in loaded:
            _model = loaded["model"]
            if "metadata" in loaded and isinstance(loaded["metadata"], dict):
                _model_metadata.update(loaded["metadata"])
        else:
            _model = loaded

        logger.info("Model loaded successfully from '%s'.", path)
        return True

    except Exception as exc:  # noqa: BLE001 - startup resilience
        logger.warning("Failed to load model from '%s': %s", path, exc)
        _model = None
        return False


def is_model_loaded() -> bool:
    """Returns True if a model is currently loaded and ready for inference."""
    return _model is not None


def get_model_metadata() -> Dict[str, Any]:
    """Returns the current model metadata (used by GET /model-info)."""
    return dict(_model_metadata)


def predict_salary(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs inference for a single prediction request.

    `payload` should be a dict matching PredictionPayload's fields.

    Returns a dict shaped for PredictResponse:
        {predicted_salary, confidence_score, id, prediction_timestamp}

    Raises RuntimeError if no model is loaded — callers (the /predict
    router) are responsible for catching this and returning a clean
    HTTP error (e.g. 503) rather than letting it become an unhandled 500.
    """
    if _model is None:
        raise RuntimeError("Model is not loaded. Cannot run prediction.")

    row = {col: payload.get(col) for col in FEATURE_COLUMNS}
    df = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    prediction = _model.predict(df)
    predicted_salary = float(np.ravel(prediction)[0])

    confidence_score = _estimate_confidence()

    return {
        "predicted_salary": round(predicted_salary, 2),
        "confidence_score": confidence_score,
        "id": str(uuid.uuid4()),
        "prediction_timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _estimate_confidence() -> float:
    """
    Placeholder confidence score.

    A proper implementation (e.g. based on prediction interval width from
    an ensemble model, or R² of the trained model) can replace this once
    train_model.py is built. For now, derives a static score from the
    model's R² if available, else defaults to 0.85.
    """
    r2 = _model_metadata.get("r2_score", 0.0)
    if r2 and r2 > 0:
        return round(min(max(r2, 0.0), 1.0), 4)
    return 0.85


# Attempt to load the model at import time so `is_model_loaded()` reflects
# reality as soon as the app starts. This never raises.
load_model()
