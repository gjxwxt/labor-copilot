#!/usr/bin/env bash
set -euo pipefail
APP_DIR="/opt/apps/services/labor-api"
if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi
export PORT="${PORT:-3301}"
export HOST="${HOST:-127.0.0.1}"
export LABOR_DB_PATH="${LABOR_DB_PATH:-$APP_DIR/data/labor.db}"
exec python3 "$APP_DIR/app.py"
