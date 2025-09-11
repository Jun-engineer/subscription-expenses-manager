# Backend Dev Notes

## Migrations (Alembic)

- Ensure the virtualenv is active and dependencies installed.
- Autogenerate a migration from current models:

```
# optional: set env vars if not using scripts/dev.sh
# export DATABASE_URL=postgresql+psycopg://app:app@localhost:5433/app
alembic revision --autogenerate -m "init"
```

- Apply migrations:

```
alembic upgrade head
```

## Tests

Run unit tests:

```
pytest
```

Configure test DB via env var `DATABASE_URL` if needed.# Backend (FastAPI)

Local development
- All-in-one launcher: `../scripts/dev.sh`
- API base: http://localhost:8000

Auth
- Signup: POST /api/v1/auth/signup { email, password, display_name }
- Login: POST /api/v1/auth/login (form fields: username=email, password) -> access_token
- Use `Authorization: Bearer <token>` for protected endpoints.

Core endpoints
- Subscriptions CRUD: /api/v1/subscriptions
- Expenses CRUD: /api/v1/expenses
- Notifications: /api/v1/notifications

Environment
- DATABASE_URL is provided by `scripts/dev.sh`.
- CORS origins can be set via `cors_origins` in `backend/.env` (comma-separated).

Notes
- Tables are initialized by `db/init.sql`. SQLAlchemy models map to the same schema.
- Background jobs scaffolded via `app/worker.py` (Celery).