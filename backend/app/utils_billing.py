from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta


def _last_day(y: int, m: int) -> int:
    return monthrange(y, m)[1]


def _normalize_dom(y: int, m: int, d: int) -> date:
    return date(y, m, min(d, _last_day(y, m)))


def _month_occurrences(start_date: date | None, billing_day: int | None, interval: int, win_start: date, win_end: date) -> int:
    if not start_date:
        return 0
    interval = max(1, int(interval or 1))
    anchor = start_date
    dom = billing_day or anchor.day
    months_from_anchor = (win_start.year - anchor.year) * 12 + (win_start.month - anchor.month)
    k = months_from_anchor // interval
    if months_from_anchor % interval != 0:
        k += 1
    y = anchor.year + (anchor.month - 1 + k * interval) // 12
    m = (anchor.month - 1 + k * interval) % 12 + 1
    cand = _normalize_dom(y, m, dom)
    if cand < win_start:
        k += 1
        y = anchor.year + (anchor.month - 1 + k * interval) // 12
        m = (anchor.month - 1 + k * interval) % 12 + 1
        cand = _normalize_dom(y, m, dom)
    count = 0
    while cand <= win_end:
        if cand >= anchor:
            count += 1
        k += 1
        y = anchor.year + (anchor.month - 1 + k * interval) // 12
        m = (anchor.month - 1 + k * interval) % 12 + 1
        cand = _normalize_dom(y, m, dom)
    return count


def _yearly_occurrences(start_date: date | None, billing_day: int | None, interval: int, win_start: date, win_end: date) -> int:
    if not start_date:
        return 0
    interval = max(1, int(interval or 1))
    anchor = start_date
    month = anchor.month
    day = billing_day or anchor.day
    years_from_anchor = win_start.year - anchor.year
    k = years_from_anchor // interval
    # If not aligned year or we've passed this year's occurrence, move to next
    if years_from_anchor % interval != 0 or (
        (win_start.month, win_start.day) > (month, min(day, _last_day(win_start.year, month)))
    ):
        k += 1
    y = anchor.year + k * interval
    cand = _normalize_dom(y, month, day)
    if cand < win_start:
        k += 1
        y = anchor.year + k * interval
        cand = _normalize_dom(y, month, day)
    count = 0
    while cand <= win_end:
        if cand >= anchor:
            count += 1
        k += 1
        y = anchor.year + k * interval
        cand = _normalize_dom(y, month, day)
    return count


def _weekly_occurrences(start_date: date | None, interval: int, win_start: date, win_end: date) -> int:
    if not start_date:
        return 0
    interval = max(1, int(interval or 1))
    anchor = start_date
    step = timedelta(days=7 * interval)
    if anchor >= win_start:
        cand = anchor
    else:
        days_diff = (win_start - anchor).days
        k = days_diff // (7 * interval)
        if days_diff % (7 * interval) != 0:
            k += 1
        cand = anchor + step * k
    count = 0
    while cand <= win_end:
        if cand >= anchor:
            count += 1
        cand += step
    return count


def count_occurrences_in_month(
    *,
    billing_cycle: str | None,
    billing_interval: int | None,
    start_date: date | None,
    billing_day: int | None,
    window_start: date,
    window_end: date,
) -> int:
    cycle = (billing_cycle or "monthly").lower()
    interval = int(billing_interval or 1)
    if cycle in ("monthly", "custom"):
        return _month_occurrences(start_date, billing_day, interval, window_start, window_end)
    if cycle == "yearly":
        return _yearly_occurrences(start_date, billing_day, interval, window_start, window_end)
    if cycle == "weekly":
        return _weekly_occurrences(start_date, interval, window_start, window_end)
    # Fallback to monthly behavior
    return _month_occurrences(start_date, billing_day, interval, window_start, window_end)
