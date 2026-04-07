from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .deps import get_db, get_current_user
from .schemas import ExpenseCreate, ExpenseUpdate, ExpenseOut
from .models import Expense, User

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(start: date | None = None, end: date | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    limit = max(1, min(limit, 500))
    offset = max(0, offset)
    q = db.query(Expense).filter(Expense.user_id == user.id)
    if start:
        q = q.filter(Expense.date >= start)
    if end:
        q = q.filter(Expense.date <= end)
    return q.order_by(Expense.date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=ExpenseOut)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = Expense(user_id=user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ExpenseOut)
def get_expense(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Expense).filter(Expense.id == item_id, Expense.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.put("/{item_id}", response_model=ExpenseOut)
def update_expense(item_id: str, payload: ExpenseUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Expense).filter(Expense.id == item_id, Expense.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_expense(item_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(Expense).filter(Expense.id == item_id, Expense.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted"}
