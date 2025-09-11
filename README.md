# Subscription & Expenses Manager

A full‑stack app to track subscriptions and variable expenses, with reminders and notifications.

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind
- Backend: FastAPI, SQLAlchemy, Pydantic v2, Uvicorn
- DB: Postgres (Docker) with Alembic migrations
- Tasks: Celery + Redis for daily reminders/notifications

## Quick start

Use the helper scripts to spin up Postgres, Redis, backend, Celery worker, and the frontend. The script auto-resolves common port conflicts and prints URLs.

```bash
# from repo root
scripts/dev.sh

# when done
scripts/stop.sh
```

On startup, you’ll see something like:

```
API       http://localhost:8000 (health: /health)
Frontend  http://localhost:3000  # or 3001/3002… if busy
```

Notes
- The frontend uses cookie-based auth; no tokens are stored in localStorage.
- The script will:
  - Start Postgres in Docker (default host port 5433) and init DB.
  - Start Redis in Docker (falls back 6379 → 6380… if busy).
  - Start the FastAPI server (http://localhost:8000).
  - Start a Celery worker with beat (scheduled tasks).
  - Start Next.js dev server (3000 → 3001/3002… if busy). If dev fails, it can fall back to a production start.

## Project structure

```
backend/        FastAPI service, models, routers, Alembic
frontend/       Next.js app (App Router)
scripts/        dev.sh and stop.sh orchestration scripts
db/             init SQL
```

## Environment

Backend env is managed via Pydantic settings. Create a `.env` in repo root (optional; sensible defaults are used for local dev):

```
# backend/app/config.py keys
SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_ALGORITHM=HS256
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Overrides (optional)
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5433/app
REDIS_URL=redis://localhost:6379/0
```

The dev script exports the effective URLs based on chosen ports, so you typically don’t need to set these for local runs.

## Database & migrations

Alembic is configured. Typical commands (run from `backend/`):

```bash
# autogenerate a revision after model changes
alembic revision -m "your message" --autogenerate

# apply migrations
alembic upgrade head
```

Migrations are applied automatically on first run in dev.

## API overview (v1)

Base URL: `http://localhost:8000/api/v1`

- Auth
  - `POST /auth/signup` – create user
  - `POST /auth/login-cookie` – set httpOnly access cookie
  - `POST /auth/refresh` – refresh the access token cookie
  - `POST /auth/logout` – clear/revoke cookie
  - `GET /auth/me` – current user
- Subscriptions – CRUD (+ pagination)
- Expenses – CRUD (+ date range filter)
- Notifications – list, mark read
- Dashboard – monthly totals, category breakdown, upcoming payments

Health checks
- `GET /health` – service health
- `GET /db-check` – DB connectivity

## Frontend

- Uses cookie-based auth; all fetches include credentials.
- React Query provider is configured; a small session helper is in `src/lib/session.ts`.
- UI pages: Home (login/signup), Subscriptions, Expenses, Dashboard, Notifications.

## Testing

Backend smoke tests live in `backend/tests/`.

```bash
# from repo root, backend venv active (if applicable)
pytest -q backend/tests
```

CI (GitHub Actions) builds the frontend and runs backend tests with a Postgres service.

## Troubleshooting

- Port already in use: the script auto-falls back for Redis (e.g., 6380) and the frontend (3001/3002…).
- Next.js ENOENT/.next cache issues: the script cleans `.next` and can fall back to a production start.
- Stuck containers: use `scripts/stop.sh` to clean up.

## License

MIT (or your preference).