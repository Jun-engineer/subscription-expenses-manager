from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .deps import get_db, get_current_user
from .schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionOut
from .models import Subscription, User

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


@router.get("", response_model=list[SubscriptionOut])
def list_subscriptions(limit: int = 100, offset: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    items = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id)
        .order_by(Subscription.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items


@router.post("", response_model=SubscriptionOut)
def create_subscription(payload: SubscriptionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = Subscription(user_id=user.id, **payload.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/{item_id}", response_model=SubscriptionOut)
def get_subscription(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.id == item_id, Subscription.user_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Not found")
    return sub


@router.put("/{item_id}", response_model=SubscriptionOut)
def update_subscription(item_id: str, payload: SubscriptionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.id == item_id, Subscription.user_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(sub, k, v)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{item_id}")
def delete_subscription(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.id == item_id, Subscription.user_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(sub)
    db.commit()
    return {"status": "deleted"}
