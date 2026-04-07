import os
from datetime import date, timedelta
from celery import Celery
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from .config import Settings
from .models import Subscription, Notification

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("worker", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.result_expires = 3600  # clean up task results after 1 hour

# Optional: enable beat for scheduled tasks if this process runs with 'celery -B'
celery_app.conf.beat_schedule = {
    "daily-next-payment-check": {
        "task": "app.worker.compute_upcoming_payments",
        "schedule": 24 * 60 * 60,  # daily
    }
}


def _advance_next_payment(current: date, cycle: str, interval: int) -> date:
    # very simple increment; can be improved for weekly/yearly/custom rules
    cycle = (cycle or "monthly").lower()
    interval = interval or 1
    if cycle == "weekly":
        return current + timedelta(weeks=interval)
    if cycle == "yearly":
        try:
            return current.replace(year=current.year + interval)
        except ValueError:
            # handle Feb 29 -> Feb 28
            return current.replace(month=2, day=28, year=current.year + interval)
    # default monthly
    month = current.month - 1 + interval
    year = current.year + month // 12
    month = month % 12 + 1
    day = min(current.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


@celery_app.task(name="app.worker.compute_upcoming_payments")
def compute_upcoming_payments():
    """Compute and update next_payment_date and create notifications for payments due tomorrow."""
    settings = Settings()
    engine = create_engine(settings.database_url)
    today = date.today()
    tomorrow = today + timedelta(days=1)
    with Session(engine) as session:
        # 1) Ensure next_payment_date exists for active subscriptions
        subs = session.execute(select(Subscription).where(Subscription.active == True)).scalars().all()
        for s in subs:
            if s.next_payment_date is None:
                # seed from start_date or today
                base = s.start_date or today
                s.next_payment_date = _advance_next_payment(base, s.billing_cycle, s.billing_interval)
        session.flush()

        # 2) Create notifications for payments due tomorrow
        due = [s for s in subs if s.next_payment_date == tomorrow]
        for s in due:
            n = Notification(
                user_id=s.user_id,
                type="payment_due",
                payload={
                    "subscription_id": str(s.id),
                    "name": s.name,
                    "amount": float(s.price),
                    "currency": s.currency,
                    "due_date": s.next_payment_date.isoformat() if s.next_payment_date else None,
                },
            )
            session.add(n)
            # advance to next cycle
            s.next_payment_date = _advance_next_payment(s.next_payment_date, s.billing_cycle, s.billing_interval)
        session.commit()
    return {"processed": len(subs), "notified": len(due)}
