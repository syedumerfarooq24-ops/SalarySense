"""
Pydantic v2 schemas for SalarySense AI.

Strictly aligned with frontend TypeScript interfaces in salaryApi.ts.
"""
from typing import List, Dict, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class PredictionPayload(BaseModel):
    """Input payload for POST /predict."""

    model_config = ConfigDict(extra="forbid")

    age: int = Field(..., ge=16, le=100)
    gender: str
    education: str
    experience: float = Field(..., ge=0, le=60)
    department: str
    job_title: str
    company_size: str
    employment_type: str
    remote_work: bool  # FIXED: Changed from str to bool to match TS boolean
    city: str


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class PredictResponse(BaseModel):
    """Response for POST /predict."""

    predicted_salary: float
    confidence_score: float
    id: str


class HistoryRecord(BaseModel):
    """A single stored prediction item returned by GET /history."""

    id: str
    created_at: str
    job_title: str
    department: str
    city: str
    experience: float
    predicted_salary: float
    status: Literal["completed", "pending", "failed"] = "completed"


# FIXED: /history returns List[HistoryRecord] directly to match salaryApi.ts
HistoryResponse = List[HistoryRecord]


class AnalyticsResponse(BaseModel):
    """Response for GET /analytics."""

    predictions_count: int
    average_salary: float
    max_salary: float
    min_salary: float
    average_experience: float
    department_distribution: Dict[str, int]
    education_distribution: Dict[str, int]


class SalaryBucket(BaseModel):
    """Item for GET /analytics/distribution."""
    range: str
    count: int


class ExperiencePoint(BaseModel):
    """Item for GET /analytics/experience."""
    experience: float
    salary: float


class ModelInfoResponse(BaseModel):
    """Response for GET /model-info."""

    algorithm: str
    r2_score: float
    dataset_size: int
    features: List[str]
    version: str
    mae: Optional[float] = None
    mse: Optional[float] = None
    rmse: Optional[float] = None


class FeatureImportance(BaseModel):
    """Item for GET /model-info/features."""
    feature: str
    importance: float


class HealthResponse(BaseModel):
    """Response for GET / (health check)."""

    status: str
    version: str
    model_loaded: bool