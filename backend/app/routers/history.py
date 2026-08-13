import logging
from typing import List

from fastapi import APIRouter, Query

from app.schemas.salary import HistoryRecord
from app.services import salary_service

logger = logging.getLogger("salarysense.routers.history")

router = APIRouter(tags=["history"])


@router.get("/history", response_model=List[HistoryRecord])
async def get_history(limit: int = Query(default=20, ge=1, le=100)):
    """
    Fetches the list of recent salary prediction records from the database.
    """
    result = salary_service.get_history(limit=limit)
    return result