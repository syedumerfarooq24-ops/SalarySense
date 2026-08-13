"""
GET /analytics router.

Returns aggregated metrics across stored predictions. Never raises a 500
on Supabase failure -- falls back to safe zeroed analytics via the
service layer.
"""
import logging
from typing import List

from fastapi import APIRouter

from app.schemas.salary import (
    AnalyticsResponse,
    SalaryBucket,
    ExperiencePoint,
)
from app.services import salary_service

logger = logging.getLogger("salarysense.routers.analytics")

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    """
    Returns aggregated analytics computed across all stored predictions:
    counts, salary min/max/average, average experience, and department /
    education distributions.
    """
    result = salary_service.get_analytics()
    return result if isinstance(result, AnalyticsResponse) else AnalyticsResponse(**result)


@router.get("/analytics/distribution", response_model=List[SalaryBucket])
async def get_salary_distribution():
    """
    Returns salary range distribution buckets for the analytics chart.
    """
    return salary_service.get_salary_distribution()


@router.get("/analytics/experience", response_model=List[ExperiencePoint])
async def get_experience_curve():
    """
    Returns average predicted salary grouped by experience level.
    """
    return salary_service.get_experience_curve()