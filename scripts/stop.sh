#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

log() { echo "[stop] $*"; }

stop_backend() {
  cd "${PROJECT_ROOT}/backend"
  if [ -f .uvicorn.pid ]; then
    PID=$(cat .uvicorn.pid || echo 0)
    if ps -p "$PID" >/dev/null 2>&1; then
      log "Stopping backend (pid $PID)..."
      kill "$PID" || true
      # wait briefly, then force kill if needed
      sleep 2
      if ps -p "$PID" >/dev/null 2>&1; then
        kill -9 "$PID" || true
      fi
    fi
    rm -f .uvicorn.pid
  fi
}

stop_frontend() {
  cd "${PROJECT_ROOT}/frontend"
  if [ -f .next.pid ]; then
    PID=$(cat .next.pid || echo 0)
    if ps -p "$PID" >/dev/null 2>&1; then
      log "Stopping frontend (pid $PID)..."
      kill "$PID" || true
      sleep 2
      if ps -p "$PID" >/dev/null 2>&1; then
        kill -9 "$PID" || true
      fi
    fi
    rm -f .next.pid
  fi
}

stop_db() {
  if command -v docker >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' | grep -qx pg; then
      log "Stopping Postgres container 'pg'..."
      docker stop pg >/dev/null || true
    fi
  fi
}

stop_worker() {
  cd "${PROJECT_ROOT}/backend"
  if [ -f .celery.pid ]; then
    PID=$(cat .celery.pid || echo 0)
    if ps -p "$PID" >/dev/null 2>&1; then
      log "Stopping Celery worker (pid $PID)..."
      kill "$PID" || true
      sleep 2
      if ps -p "$PID" >/dev/null 2>&1; then
        kill -9 "$PID" || true
      fi
    fi
    rm -f .celery.pid
  fi
}

stop_redis() {
  if command -v docker >/dev/null 2>&1; then
    if docker ps --format '{{.Names}}' | grep -qx redis; then
      log "Stopping Redis container 'redis'..."
      docker stop redis >/dev/null || true
    fi
  fi
}

stop_backend
stop_frontend
stop_db
stop_worker
stop_redis
log "All services stopped."
