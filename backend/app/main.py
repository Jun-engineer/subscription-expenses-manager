from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .db import db_ping, engine
from .config import settings
from .models import Base
from . import routers_auth, routers_subscriptions, routers_expenses, routers_notifications, routers_dashboard

app = FastAPI(title="Subscription & Expenses Manager API")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        from time import time
        start = time()
        response = await call_next(request)
        dur = int((time() - start) * 1000)
        try:
            path = request.url.path
        except Exception:
            path = "-"
        print(f"{request.method} {path} -> {response.status_code} {dur}ms")
        return response

app.add_middleware(RequestLoggerMiddleware)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    try:
        ok = db_ping() == 1
        return {"db": "ok" if ok else "fail"}
    except Exception as e:
        return {"db": "error", "detail": str(e)}


# CORS
origins = [o.strip() for o in (settings.cors_origins or "").split(",") if o.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Create metadata if not exists (tables are already created by init.sql, but safe for tests)
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass


# Routers
app.include_router(routers_auth.router)
app.include_router(routers_subscriptions.router)
app.include_router(routers_expenses.router)
app.include_router(routers_notifications.router)
app.include_router(routers_dashboard.router)
