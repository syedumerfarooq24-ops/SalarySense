"""
POST /predict router.

Accepts a PredictionPayload, runs model inference, logs the prediction
asynchronously to Supabase, and returns the prediction details.
"""
import logging

from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.schemas.salary import PredictionPayload, PredictResponse
from app.services import salary_service

logger = logging.getLogger("salarysense.routers.predict")

router = APIRouter(tags=["predict"])


@router.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictionPayload, background_tasks: BackgroundTasks):
    """
    Runs salary prediction for the given employee attributes.

    - Validates input via PredictionPayload (Pydantic).
    - Runs inference synchronously (fast, in-process).
    - Logs the prediction to Supabase asynchronously via BackgroundTasks,
      so the response is not delayed by (or dependent on) DB availability.
    - Returns 503 if the model is not loaded, rather than a raw 500.
    """
    try:
        result = salary_service.run_prediction(payload.model_dump())
    except RuntimeError as exc:
        logger.warning("Prediction attempted while model unavailable: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Prediction model is not currently available. Please try again later.",
        ) from exc
    except Exception as exc:  # noqa: BLE001 - guard against unexpected inference errors
        logger.error("Unexpected error during prediction: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating the prediction.",
        ) from exc

    # Fire-and-forget logging: does not block or affect the response above.
    background_tasks.add_task(salary_service.log_prediction, payload.model_dump(), result)

    return PredictResponse(**result)
