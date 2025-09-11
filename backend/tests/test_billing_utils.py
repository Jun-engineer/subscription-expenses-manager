from datetime import date

from app.utils_billing import count_occurrences_in_month


def test_monthly_basic_same_dom():
    # Start Jan 15, monthly, within March window -> one charge on Mar 15
    occ = count_occurrences_in_month(
        billing_cycle="monthly",
        billing_interval=1,
        start_date=date(2024, 1, 15),
        billing_day=None,
        window_start=date(2024, 3, 1),
        window_end=date(2024, 3, 31),
    )
    assert occ == 1


esses = None

def test_monthly_31st_short_months():
    # Start Jan 31, billing_day=31, Feb occurrence normalizes to Feb 29 (leap), Apr 30 -> occurrence Apr 30
    # Window April 2024 should have one occurrence (Apr 30)
    occ = count_occurrences_in_month(
        billing_cycle="monthly",
        billing_interval=1,
        start_date=date(2024, 1, 31),
        billing_day=31,
        window_start=date(2024, 4, 1),
        window_end=date(2024, 4, 30),
    )
    assert occ == 1


def test_yearly_interval_two():
    # Start 2020-06-10, yearly every 2 years; in 2024-06 window it's an occurrence
    occ = count_occurrences_in_month(
        billing_cycle="yearly",
        billing_interval=2,
        start_date=date(2020, 6, 10),
        billing_day=None,
        window_start=date(2024, 6, 1),
        window_end=date(2024, 6, 30),
    )
    assert occ == 1


def test_weekly_three_weeks_interval():
    # Start 2024-03-05 (Tue), every 3 weeks, in April 2024 should get occurrences depending on alignment
    occ = count_occurrences_in_month(
        billing_cycle="weekly",
        billing_interval=3,
        start_date=date(2024, 3, 5),
        billing_day=None,
        window_start=date(2024, 4, 1),
        window_end=date(2024, 4, 30),
    )
    assert occ >= 1
