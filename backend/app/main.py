"""
SalarySense AI - FastAPI Application Entrypoint
"""
import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.ml import predictor
from app.routers import predict, history, analytics, model

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("salarysense")

APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
MODEL_PATH = os.getenv("MODEL_PATH", "salary_model.pkl")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: predictor.load_model() already runs at import time, but we
    # re-log the result here so it's visible in startup logs and so this
    # is the natural place to add retry/refresh logic later if needed.
    logger.info("SalarySense AI backend starting up (version %s)", APP_VERSION)
    if predictor.is_model_loaded():
        logger.info("ML model is loaded and ready.")
    else:
        logger.warning(
            "ML model is NOT loaded (missing/invalid '%s'). "
            "/predict will return 503 until a valid model is trained/placed.",
            MODEL_PATH,
        )
    yield
    # Shutdown
    logger.info("SalarySense AI backend shutting down")


app = FastAPI(
    title="SalarySense AI API",
    description="Backend API for the SalarySense AI Employee Salary Prediction Dashboard",
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check():
    """
    Health check endpoint.
    Returns API status, version, and model load status.
    """
    return {
        "status": "ok",
        "version": APP_VERSION,
        "model_loaded": predictor.is_model_loaded(),
    }


app.include_router(predict.router)
app.include_router(history.router)
app.include_router(analytics.router)
app.include_router(model.router)
