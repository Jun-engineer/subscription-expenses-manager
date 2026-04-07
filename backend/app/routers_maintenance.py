import hmac
from fastapi import APIRouter, Header, HTTPException
from .config import settings

router = APIRouter(prefix="/api/v1/maintenance", tags=["maintenance"])


@router.post("/compute-upcoming")
def compute_upcoming_payments_endpoint(x_maintenance_key: str | None = Header(default=None)):
    if not settings.maintenance_key:
        raise HTTPException(status_code=403, detail="Maintenance key not configured")
    if not hmac.compare_digest(x_maintenance_key or "", settings.maintenance_key):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # If Celery is enabled, trigger async; otherwise run inline
    if settings.enable_celery:
        try:
            from .worker import compute_upcoming_payments
            task = compute_upcoming_payments.delay()
            return {"status": "queued", "task_id": task.id}
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to queue task")
    else:
        try:
            from .worker import compute_upcoming_payments as compute
            result = compute()
            return {"status": "ok", "result": result}
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to compute")
