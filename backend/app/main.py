from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .db import db_ping, engine
from .config import settings
from .models import Base
from . import routers_auth, routers_subscriptions, routers_expenses, routers_notifications, routers_dashboard, routers_maintenance, routers_vault
import logging

logger = logging.getLogger(__name__)

if settings.secret_key == "change-me":
    if settings.cookie_secure:
        raise RuntimeError("SECRET_KEY must be set to a strong random value in production. "
                           "Set SECRET_KEY in your .env file.")
    logger.warning("SECRET_KEY is set to the default 'change-me'. Set a strong secret in production!")

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self' " + (settings.cors_origins or "") + "; "
            "frame-ancestors 'none'"
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)
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
        logger.error(f"db-check failed: {e}")
        return {"db": "error"}


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
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")


# Routers
app.include_router(routers_auth.router)
app.include_router(routers_subscriptions.router)
app.include_router(routers_expenses.router)
app.include_router(routers_notifications.router)
app.include_router(routers_dashboard.router)
app.include_router(routers_maintenance.router)
app.include_router(routers_vault.router)
