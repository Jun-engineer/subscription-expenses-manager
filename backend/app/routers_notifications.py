from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from .deps import get_db, get_current_user
from .schemas import NotificationOut
from .models import Notification, User

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user.id, Notification.read == False)  # noqa: E712
        .scalar()
    )
    return {"count": count}


@router.get("", response_model=list[NotificationOut])
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.post("/mark-read")
def mark_read(ids: list[str], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.id.in_(ids)).update({Notification.read: True}, synchronize_session=False)
    db.commit()
    return {"status": "ok"}
