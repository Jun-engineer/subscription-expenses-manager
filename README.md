# SubManager

A full-stack personal finance app for tracking recurring subscriptions, one-off expenses, and securely storing credentials — with an interactive dashboard, notification system, and encrypted password vault.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| Database | PostgreSQL 16, Alembic migrations |
| Task queue | Celery + Redis (scheduled reminders) |
| Auth | JWT in httpOnly cookies, refresh token rotation |
| Encryption | Fernet (AES-128-CBC) for vault entries |
| CI | GitHub Actions (frontend build + backend tests) |
| Deployment | Google Cloud Run (backend), Vercel (frontend), Neon (database) |

## Features

- **Subscriptions** — Track recurring services with billing cycle support (daily / weekly / bi-weekly / monthly / quarterly / yearly). Category tagging, cost breakdowns, and next-payment dates.
- **Expenses** — Log one-off expenses with date range filtering and category grouping.
- **Dashboard** — Monthly spending totals, category breakdowns, and upcoming payment calendar.
- **Password vault** — Fernet-encrypted credential storage (site, username, password, notes). Passwords are revealed on demand via a copy/show toggle.
- **Notifications** — Payment reminders and system alerts, with read/unread management.
- **Auth** — Cookie-based JWT auth with refresh token rotation. No tokens in localStorage. Full account deletion with cascade.
- **Dark mode** — Automatic via `prefers-color-scheme` with a CSS custom-property design system.

## Quick start

### Using the dev script (recommended)

```bash
# from repo root — starts Postgres, Redis, backend, Celery worker, and frontend
scripts/dev.sh

# when done
scripts/stop.sh
```

The script auto-resolves port conflicts (Redis falls back 6379→6380, frontend 3000→3001/3002), runs Alembic migrations, and prints URLs:

```
API       http://localhost:8000 (health: /health)
Frontend  http://localhost:3000
```

### Using Docker Compose

```bash
docker compose up -d          # starts db, redis, backend, worker
cd frontend && npm install && npm run dev   # start frontend locally
```

## Project structure

```
backend/
  app/
    main.py               # FastAPI app, middleware, router mounts
    config.py             # Pydantic settings (env-driven)
    models.py             # SQLAlchemy models (6 tables)
    schemas.py            # Pydantic request/response schemas
    auth.py               # JWT creation, cookie helpers
    crypto.py             # Fernet encrypt/decrypt for vault
    deps.py               # Dependency injection (db session, current user)
    routers_auth.py       # Signup, login, logout, refresh, account deletion
    routers_subscriptions.py
    routers_expenses.py
    routers_dashboard.py
    routers_vault.py
    routers_notifications.py
    routers_maintenance.py
    utils_billing.py      # Billing cycle calculations
    worker.py             # Celery tasks (reminders)
  alembic/                # Migration versions
  tests/                  # Pytest suite
frontend/
  src/
    app/                  # Next.js App Router pages
      dashboard/          # Spending overview
      subscriptions/      # List + detail ([id])
      expenses/           # List + detail ([id])
      vault/              # Encrypted credentials
      notifications/      # Alerts
    components/           # AuthGuard, Nav, Toast, StartupOverlay, ClientProviders
    lib/                  # auth.ts, http.ts, session.ts helpers
scripts/
  dev.sh                  # Full local dev orchestrator
  stop.sh                 # Clean shutdown
db/
  init.sql                # DDL for initial schema
```

## Environment variables

Backend configuration is managed via Pydantic settings. Create `backend/.env` for local dev:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me` | JWT signing key (must change in production) |
| `DATABASE_URL` | `postgresql+psycopg://app:app@db:5432/app` | Database connection string |
| `REDIS_URL` | `redis://redis:6379/0` | Redis for Celery |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `COOKIE_DOMAIN` | `None` | Cookie domain (set for cross-domain deploys) |
| `COOKIE_SAMESITE` | `lax` | SameSite cookie policy |
| `COOKIE_SECURE` | `false` | Require HTTPS for cookies |
| `VAULT_KEY` | derived from SECRET_KEY | Fernet key for vault encryption |

The dev script exports effective URLs based on resolved ports, so you typically don't need to override these locally.

Frontend env (set in Vercel or `.env.local`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE` | Backend API base URL (e.g., `http://localhost:8000`) |

## Database & migrations

```bash
cd backend

# autogenerate a migration after model changes
alembic revision -m "description" --autogenerate

# apply all pending migrations
alembic upgrade head
```

Migrations run automatically on first `scripts/dev.sh` startup.

**Database tables:** `users`, `subscriptions`, `expenses`, `notifications`, `refresh_tokens`, `vault_entries`

## API overview

Base URL: `http://localhost:8000/api/v1`

| Group | Endpoints |
|-------|-----------|
| **Auth** | `POST /auth/signup`, `POST /auth/login-cookie`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `DELETE /auth/account` |
| **Subscriptions** | `GET /subscriptions`, `POST /subscriptions`, `GET /subscriptions/{id}`, `PUT /subscriptions/{id}`, `DELETE /subscriptions/{id}` |
| **Expenses** | `GET /expenses`, `POST /expenses`, `GET /expenses/{id}`, `PUT /expenses/{id}`, `DELETE /expenses/{id}` |
| **Vault** | `GET /vault`, `POST /vault`, `PUT /vault/{id}`, `DELETE /vault/{id}` |
| **Dashboard** | `GET /dashboard/summary` |
| **Notifications** | `GET /notifications`, `PATCH /notifications/{id}/read` |
| **Maintenance** | `POST /maintenance/generate-notifications` |
| **Health** | `GET /health`, `GET /db-check` |

## Testing

```bash
pytest -q backend/tests
```

CI runs on every push: builds the frontend and runs backend tests against a PostgreSQL service container.

## Deployment

- **Backend** → Google Cloud Run (Docker image from `backend/Dockerfile`)
- **Frontend** → Vercel (auto-deploys from `frontend/`)
- **Database** → Neon (managed PostgreSQL)

Set production environment variables (`SECRET_KEY`, `DATABASE_URL`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, `COOKIE_DOMAIN`) in each platform's settings.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | The dev script auto-falls back for Redis (6380) and frontend (3001/3002) |
| Next.js cache / ENOENT errors | `rm -rf frontend/.next` — the dev script handles this automatically |
| Stuck containers | `scripts/stop.sh` cleans up all Docker containers and PID files |
| Cookie not sent in browser | Check `CORS_ORIGINS` includes the frontend URL, and `COOKIE_SAMESITE`/`COOKIE_SECURE` match your scheme |
