import json
import sys
import os

# Make sure the backend root is in sys.path when running as a Celery worker
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import redis
from worker.celery_app import celery_app
from database import SessionLocal, TrainingJob
from ml.automl import run_automl
from config import settings


def _get_redis():
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


def _publish(r: redis.Redis, task_id: str, payload: dict):
    channel = f"task:{task_id}:logs"
    r.publish(channel, json.dumps(payload))


@celery_app.task(bind=True, name="worker.tasks.train_model")
def train_model(self, task_id: str, file_path: str, target_col: str):
    """Celery task: run AutoML pipeline and stream progress via Redis Pub/Sub."""
    r = _get_redis()
    db = SessionLocal()

    def publish_fn(payload: dict):
        _publish(r, task_id, payload)

    try:
        # Mark as running
        job = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
        if job:
            job.status = "running"
            db.commit()

        publish_fn({"type": "LOG", "message": "🚀 Training job started..."})

        results = run_automl(file_path, target_col, publish_fn)

        # Save results
        job = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
        if job:
            job.status = "done"
            job.problem_type = results.get("problem_type")
            job.results = json.dumps(results)
            db.commit()

        publish_fn({
            "type": "DONE",
            "message": "✅ Training complete!",
            "results": results,
        })

    except Exception as exc:
        error_msg = str(exc)
        job = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
        if job:
            job.status = "error"
            job.error_message = error_msg
            db.commit()

        publish_fn({"type": "ERROR", "message": f"❌ Training failed: {error_msg}"})
        raise self.retry(exc=exc, max_retries=0)  # Don't retry, just propagate

    finally:
        db.close()
        r.close()
