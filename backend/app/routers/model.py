"""
GET /model-info and POST /train routers.

GET /model-info returns ML model metrics and feature metadata, reflecting
safe defaults (zeroed metrics) if no model has been trained/loaded yet.

POST /train retrains the model synchronously and returns refreshed
metrics, or a clean error if training fails.
"""
import logging

from fastapi import APIRouter, HTTPException

from app.schemas.salary import ModelInfoResponse
from app.services import salary_service

logger = logging.getLogger("salarysense.routers.model")

router = APIRouter(tags=["model"])


@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Returns metadata about the currently loaded ML model: algorithm,
    performance metrics (r2_score, mae, mse, rmse), dataset size,
    feature list, and version.

    If no model is loaded (e.g. salary_model.pkl missing), returns the
    predictor module's safe zeroed-metric defaults instead of erroring.
    """
    result = salary_service.get_model_info()
    return ModelInfoResponse(**result)


@router.post("/train", response_model=ModelInfoResponse)
async def train_model_endpoint():
    """
    Retrains the model (currently on a freshly generated synthetic
    dataset -- swap in a real dataset source once available), updates
    salary_model.pkl, hot-reloads it into the running predictor, and
    returns the refreshed model metrics.

    This runs synchronously and may take a few seconds. Returns 500 with
    a clear message if training or reload fails, rather than a raw
    unhandled exception.
    """
    try:
        result = salary_service.retrain_model()
    except RuntimeError as exc:
        logger.error("Training endpoint failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ModelInfoResponse(**result)
