from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    sample_values: list[Any]


class UploadResponse(BaseModel):
    filename: str
    row_count: int
    columns: list[ColumnInfo]
    preview: list[dict]


class TrainRequest(BaseModel):
    filename: str
    target_col: str


class TrainResponse(BaseModel):
    task_id: str
    status: str
    message: str


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class Metrics(BaseModel):
    problem_type: str
    # Classification metrics
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    auc: Optional[float] = None
    # Regression metrics
    rmse: Optional[float] = None
    r2: Optional[float] = None
    mae: Optional[float] = None


class ConfusionMatrixData(BaseModel):
    labels: list[str]
    matrix: list[list[int]]


class TrainingResults(BaseModel):
    metrics: Metrics
    feature_importance: list[FeatureImportance]
    confusion_matrix: Optional[ConfusionMatrixData] = None
    best_model_name: str


class JobStatusResponse(BaseModel):
    task_id: str
    status: str
    problem_type: Optional[str] = None
    results: Optional[TrainingResults] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
