#!/usr/bin/env bash
set -euo pipefail

# Start Postgres (Docker), FastAPI backend (venv + uvicorn), and Next.js frontend.
# - DB runs in container `pg` on host port 5433, seeded by ./db/init.sql
# - Backend listens on :8000
# - Frontend listens on :3000

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_HOST=${DB_HOST:-localhost}
DB_PORT_HOST=${DB_PORT_HOST:-5433}
DB_NAME=${DB_NAME:-app}
DB_USER=${DB_USER:-app}
DB_PASS=${DB_PASS:-app}
DB_READY_TIMEOUT=${DB_READY_TIMEOUT:-60}
BACKEND_HEALTH_TIMEOUT=${BACKEND_HEALTH_TIMEOUT:-60}
FRONTEND_HEALTH_TIMEOUT=${FRONTEND_HEALTH_TIMEOUT:-90}
RESTART_ON_HEALTH_FAIL=${RESTART_ON_HEALTH_FAIL:-1}
DATABASE_URL="postgresql+psycopg://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT_HOST}/${DB_NAME}"
REDIS_PORT_HOST=${REDIS_PORT_HOST:-6379}
REDIS_URL="redis://localhost:${REDIS_PORT_HOST}/0"

log() { echo "[dev] $*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found." >&2
    exit 1
  fi
}

wait_for_http() {
  local url=$1
  local timeout=${2:-60}
  for i in $(seq 1 "$timeout"); do
    if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    if (( i % 5 == 0 )); then
      log "waiting for ${url} (${i}s/${timeout}s)"
    fi
  done
  return 1
}

is_port_in_use() {
  local port=$1
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | awk '{print $4}' | grep -E "(^|:)${port}$" >/dev/null 2>&1
    return $?
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tuln | awk '{print $4}' | grep -E "(^|:)${port}$" >/dev/null 2>&1
    return $?
  else
    # Fallback: try to bind using python
    python3 - <<PY >/dev/null 2>&1
import socket
s=socket.socket()
try:
    s.bind(('0.0.0.0', ${1}))
    print('free')
finally:
    s.close()
PY
    [ $? -ne 0 ] && return 0 || return 1
  fi
}

start_db() {
  require_cmd docker
  log "Starting Postgres container 'pg' on host port ${DB_PORT_HOST}..."
  docker volume create pgdata >/dev/null
  # If a container with this name exists, remove it to avoid port conflicts and stale state
  if docker ps -a --format '{{.Names}}' | grep -qx pg; then
    if ! docker start pg >/dev/null 2>&1; then
      log "Recreating container 'pg'..."
      docker rm -f pg >/dev/null 2>&1 || true
    fi
  fi

  if ! docker ps --format '{{.Names}}' | grep -qx pg; then
    docker run -d --name pg \
      -e POSTGRES_USER="${DB_USER}" \
      -e POSTGRES_PASSWORD="${DB_PASS}" \
      -e POSTGRES_DB="${DB_NAME}" \
      -p "${DB_PORT_HOST}:5432" \
      -v pgdata:/var/lib/postgresql/data \
      -v "${PROJECT_ROOT}/db/init.sql":/docker-entrypoint-initdb.d/00-init.sql:ro \
      postgres:16 >/dev/null
  fi

  # Wait for readiness
  log "Waiting for Postgres to become ready..."
  for i in $(seq 1 "$DB_READY_TIMEOUT"); do
    if docker exec pg pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
      log "Postgres is ready."
      break
    fi
    sleep 1
    if [ "$i" -eq "$DB_READY_TIMEOUT" ]; then
      echo "Postgres did not become ready in time" >&2
      exit 1
    fi
  done
}

start_redis() {
  require_cmd docker
  log "Starting Redis container 'redis' on host port ${REDIS_PORT_HOST}..."
  # If desired port is busy, find a free one 6380..6399
  if is_port_in_use "${REDIS_PORT_HOST}"; then
    for p in $(seq 6380 6399); do
      if ! is_port_in_use "$p"; then
        REDIS_PORT_HOST=$p
        REDIS_URL="redis://localhost:${REDIS_PORT_HOST}/0"
        log "Port 6379 busy. Using Redis on host port ${REDIS_PORT_HOST}."
        break
      fi
    done
  fi
  if docker ps -a --format '{{.Names}}' | grep -qx redis; then
    if ! docker start redis >/dev/null 2>&1; then
      log "Recreating container 'redis'..."
      docker rm -f redis >/dev/null 2>&1 || true
    fi
  fi
  if ! docker ps --format '{{.Names}}' | grep -qx redis; then
    docker run -d --name redis -p "${REDIS_PORT_HOST}:6379" redis:7-alpine >/dev/null
  fi
}

start_backend() {
  require_cmd python3
  log "Starting backend on :${BACKEND_PORT}..."
  cd "${PROJECT_ROOT}/backend"

  # venv
  if [ ! -d .venv ]; then
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --upgrade pip >/dev/null
  pip install -r requirements.txt >/dev/null

  # If already running, verify it's actually healthy; otherwise restart
  if [ -f .uvicorn.pid ] && ps -p "$(cat .uvicorn.pid 2>/dev/null || echo 0)" >/dev/null 2>&1; then
    log "Backend already running (pid $(cat .uvicorn.pid)). Checking health..."
    if ! wait_for_http "http://localhost:${BACKEND_PORT}/health" 5; then
      log "Existing backend not healthy; restarting it..."
      kill "$(cat .uvicorn.pid)" || true
      sleep 1
      if ps -p "$(cat .uvicorn.pid 2>/dev/null || echo 0)" >/dev/null 2>&1; then
        kill -9 "$(cat .uvicorn.pid)" || true
      fi
      rm -f .uvicorn.pid
    fi
  fi

  if [ ! -f .uvicorn.pid ]; then
    # Start in background, capture PID
  nohup env DATABASE_URL="${DATABASE_URL}" REDIS_URL="${REDIS_URL}" \
      uvicorn app.main:app --reload --host 0.0.0.0 --port "${BACKEND_PORT}" \
      > "${PROJECT_ROOT}/backend/.uvicorn.out" 2>&1 &
    echo $! > .uvicorn.pid
    log "Backend started (pid $(cat .uvicorn.pid))."
  fi

  log "Waiting for backend health..."
  if ! wait_for_http "http://localhost:${BACKEND_PORT}/health" "$BACKEND_HEALTH_TIMEOUT"; then
    if [ "$RESTART_ON_HEALTH_FAIL" = "1" ]; then
      log "Backend health timeout. Attempting one restart..."
      kill "$(cat .uvicorn.pid 2>/dev/null || echo 0)" || true
      sleep 1
      rm -f .uvicorn.pid
  nohup env DATABASE_URL="${DATABASE_URL}" REDIS_URL="${REDIS_URL}" \
        uvicorn app.main:app --reload --host 0.0.0.0 --port "${BACKEND_PORT}" \
        > "${PROJECT_ROOT}/backend/.uvicorn.out" 2>&1 &
      echo $! > .uvicorn.pid
      if ! wait_for_http "http://localhost:${BACKEND_PORT}/health" "$BACKEND_HEALTH_TIMEOUT"; then
        echo "Backend did not respond on /health after restart" >&2
        echo "Last 80 lines of backend log:" >&2
        tail -n 80 "${PROJECT_ROOT}/backend/.uvicorn.out" >&2 || true
        exit 1
      fi
    else
      echo "Backend did not respond on /health" >&2
      echo "Last 80 lines of backend log:" >&2
      tail -n 80 "${PROJECT_ROOT}/backend/.uvicorn.out" >&2 || true
      exit 1
    fi
  fi
}

start_worker() {
  log "Starting Celery worker with beat..."
  cd "${PROJECT_ROOT}/backend"
  # venv should already be active from start_backend; ensure it is
  if [ -z "${VIRTUAL_ENV:-}" ]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  fi
  if [ -f .celery.pid ] && ps -p "$(cat .celery.pid 2>/dev/null || echo 0)" >/dev/null 2>&1; then
    log "Celery worker already running (pid $(cat .celery.pid))."
    return
  fi
  nohup env DATABASE_URL="${DATABASE_URL}" REDIS_URL="${REDIS_URL}" \
    celery -A app.worker worker -B -l info \
    > "${PROJECT_ROOT}/backend/.celery.out" 2>&1 &
  echo $! > .celery.pid
  log "Celery worker started (pid $(cat .celery.pid))."
}

start_frontend() {
  require_cmd npm
  # Pick another port if default is in use
  if is_port_in_use "${FRONTEND_PORT}"; then
    for p in $(seq 3001 3010); do
      if ! is_port_in_use "$p"; then
        log "Port ${FRONTEND_PORT} busy. Using frontend on host port ${p}."
        FRONTEND_PORT=$p
        break
      fi
    done
  fi
  log "Starting frontend on :${FRONTEND_PORT}..."
  cd "${PROJECT_ROOT}/frontend"

  if [ ! -d node_modules ]; then
    npm install >/dev/null
  fi

  # If already running, skip
  if [ -f .next.pid ] && ps -p "$(cat .next.pid 2>/dev/null || echo 0)" >/dev/null 2>&1; then
    log "Frontend already running (pid $(cat .next.pid))."
  else
    # Start in background; pass host/port to next dev, and API base URL
    export NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE:-"http://localhost:${BACKEND_PORT}"}
  # Clean any corrupted build cache
  rm -rf .next || true
  nohup npm run dev -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}" \
      > "${PROJECT_ROOT}/frontend/.next.out" 2>&1 &
    echo $! > .next.pid
    log "Frontend started (pid $(cat .next.pid))."
  fi

  log "Waiting for frontend..."
  if ! wait_for_http "http://localhost:${FRONTEND_PORT}" "$FRONTEND_HEALTH_TIMEOUT"; then
    if [ "$RESTART_ON_HEALTH_FAIL" = "1" ]; then
      log "Frontend health timeout. Attempting one restart..."
      if [ -f .next.pid ]; then
        kill "$(cat .next.pid 2>/dev/null || echo 0)" || true
        sleep 1
        rm -f .next.pid
      fi
      nohup npm run dev -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}" \
        > "${PROJECT_ROOT}/frontend/.next.out" 2>&1 &
      echo $! > .next.pid
      if ! wait_for_http "http://localhost:${FRONTEND_PORT}" "$FRONTEND_HEALTH_TIMEOUT"; then
        log "Dev server failed health again. Falling back to production build..."
        # Build and start production server
        rm -f .next.pid
        npm run build > "${PROJECT_ROOT}/frontend/.next.build.out" 2>&1 || {
          echo "Frontend build failed" >&2
          tail -n 120 "${PROJECT_ROOT}/frontend/.next.build.out" >&2 || true
          exit 1
        }
        nohup npm run start -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}" \
          > "${PROJECT_ROOT}/frontend/.next.out" 2>&1 &
        echo $! > .next.pid
        if ! wait_for_http "http://localhost:${FRONTEND_PORT}" 60; then
          echo "Frontend did not become reachable on port ${FRONTEND_PORT}" >&2
          echo "Last 120 lines of frontend log:" >&2
          tail -n 120 "${PROJECT_ROOT}/frontend/.next.out" >&2 || true
          exit 1
        fi
      fi
    else
      echo "Frontend did not become reachable on port ${FRONTEND_PORT}" >&2
      echo "Last 80 lines of frontend log:" >&2
      tail -n 80 "${PROJECT_ROOT}/frontend/.next.out" >&2 || true
      exit 1
    fi
  fi
}

main() {
  start_db
  start_redis
  start_backend
  start_worker
  start_frontend
  log "All services are up."
  echo ""
  echo "URLs:"
  echo "  API       http://localhost:${BACKEND_PORT} (health: /health)"
  echo "  Frontend  http://localhost:${FRONTEND_PORT}"
  echo ""
  echo "Tips:"
  echo "  - Tail backend logs: tail -f backend/.uvicorn.out"
  echo "  - Tail frontend logs: tail -f frontend/.next.out"
}

main "$@"
