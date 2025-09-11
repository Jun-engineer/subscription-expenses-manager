import os
import pytest
import requests

API = os.getenv("API_BASE", "http://localhost:8000")


@pytest.mark.smoke
def test_health_ok():
    r = requests.get(f"{API}/health", timeout=5)
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.smoke
def test_db_check_ok():
    r = requests.get(f"{API}/db-check", timeout=5)
    assert r.status_code == 200
    data = r.json()
    assert data.get("db") == "ok"