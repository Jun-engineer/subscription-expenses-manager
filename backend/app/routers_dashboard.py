from datetime import date, datetime, timedelta
from calendar import monthrange
from fastapi import APIRouter, Depends
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from .deps import get_db, get_current_user
from .models import Expense, Subscription, User
from .utils_billing import count_occurrences_in_month

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


def month_bounds(month_str: str | None) -> tuple[date, date]:
    today = date.today()
    if month_str:
        try:
            y, m = map(int, month_str.split("-"))
            first = date(y, m, 1)
        except Exception:
            first = date(today.year, today.month, 1)
    else:
        first = date(today.year, today.month, 1)
    last_day = monthrange(first.year, first.month)[1]
    last = date(first.year, first.month, last_day)
    return first, last


@router.get("/dashboard")
def dashboard(month: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    start, end = month_bounds(month)

    # Variable expenses within month
    variable_total = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user.id, Expense.date >= start, Expense.date <= end)
        .scalar()
    )

    # Subscriptions active for user
    subs = (
        db.query(Subscription)
        .filter(Subscription.user_id == user.id, Subscription.active == True)  # noqa: E712
        .all()
    )
    
    subscription_total = 0.0
    for s in subs:
        occurrences = count_occurrences_in_month(
            billing_cycle=s.billing_cycle,
            billing_interval=s.billing_interval,
            start_date=s.start_date,
            billing_day=s.billing_day,
            window_start=start,
            window_end=end,
        )
        subscription_total += float(s.price) * occurrences

    # Expense category breakdown within month
    rows = (
        db.query(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.user_id == user.id, Expense.date >= start, Expense.date <= end)
        .group_by(Expense.category)
        .all()
    )
    breakdown = {k or "Uncategorized": float(v) for k, v in rows}

    # Upcoming payments: next 7 days from today (cross-month aware)
    today = date.today()
    upcoming_end = today + timedelta(days=7)
    upcoming = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user.id,
            Subscription.active == True,  # noqa: E712
            Subscription.next_payment_date.isnot(None),
            and_(Subscription.next_payment_date >= today, Subscription.next_payment_date <= upcoming_end),
        )
        .order_by(Subscription.next_payment_date.asc())
        .all()
    )

    return {
        "month": f"{start.year:04d}-{start.month:02d}",
        "subscription_total": round(subscription_total, 2),
        "variable_total": float(variable_total or 0),
        "breakdown": breakdown,
        "upcoming_payments": [
            {
                "id": str(u.id),
                "name": u.name,
                "amount": float(u.price),
                "date": u.next_payment_date.isoformat() if u.next_payment_date else None,
            }
            for u in upcoming
        ],
    }
