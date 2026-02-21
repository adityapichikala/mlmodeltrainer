import os
import uuid
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models import TrainRequest, TrainResponse
from database import get_db, TrainingJob
from config import settings

router = APIRouter()


@router.post("/train", response_model=TrainResponse)
def start_training(request: TrainRequest, db: Session = Depends(get_db)):
    """Validate request and dispatch a Celery training task."""
    file_path = os.path.join(settings.UPLOAD_DIR, request.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found. Please upload again.")

    # Basic check: can we read the target column?
    try:
        import pandas as pd
        df_check = pd.read_csv(file_path, nrows=5)
        if request.target_col not in df_check.columns:
            raise HTTPException(
                status_code=400,
                detail=f"Target column '{request.target_col}' not found in CSV.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV read error: {str(e)}")

    task_id = str(uuid.uuid4())

    # Persist the job record
    job = TrainingJob(
        task_id=task_id,
        filename=request.filename,
        target_col=request.target_col,
        status="pending",
    )
    db.add(job)
    db.commit()

    # Fire off the Celery task (imported here to avoid circular imports at startup)
    from worker.tasks import train_model
    train_model.apply_async(
        args=[task_id, file_path, request.target_col],
        task_id=task_id,
    )

    return TrainResponse(
        task_id=task_id,
        status="pending",
        message="Training job queued successfully.",
    )
