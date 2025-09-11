from fastapi import APIRouter, Header, HTTPException
from .config import settings

router = APIRouter(prefix="/api/v1/maintenance", tags=["maintenance"])


@router.post("/compute-upcoming")
def compute_upcoming_payments_endpoint(x_maintenance_key: str | None = Header(default=None)):
    # Optional key check
    if settings.maintenance_key and x_maintenance_key != settings.maintenance_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # If Celery is enabled, trigger async; otherwise run inline
    if settings.enable_celery:
        try:
            from .worker import compute_upcoming_payments
            task = compute_upcoming_payments.delay()
            return {"status": "queued", "task_id": task.id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to queue task: {e}")
    else:
        try:
            from .worker import compute_upcoming_payments as compute
            result = compute()
            return {"status": "ok", "result": result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to compute: {e}")
