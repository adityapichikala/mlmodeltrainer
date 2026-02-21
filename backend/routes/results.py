import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models import JobStatusResponse, TrainingResults
from database import get_db, TrainingJob

router = APIRouter()


@router.get("/results/{task_id}", response_model=JobStatusResponse)
def get_results(task_id: str, db: Session = Depends(get_db)):
    """Return the current status and results for a training job."""
    job: TrainingJob = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    results = None
    if job.results:
        try:
            raw = json.loads(job.results)
            results = TrainingResults(**raw)
        except Exception:
            results = None

    return JobStatusResponse(
        task_id=job.task_id,
        status=job.status,
        problem_type=job.problem_type,
        results=results,
        error_message=job.error_message,
        created_at=job.created_at,
    )
