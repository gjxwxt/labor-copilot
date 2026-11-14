#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT_DIR/.env.deploy}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Copy .env.deploy.example to .env.deploy first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_SSH_KEY:?DEPLOY_SSH_KEY is required}"
: "${DEPLOY_SLUG:?DEPLOY_SLUG is required}"

DIST_DIR="${1:-$ROOT_DIR/dist}"
if [ ! -d "$DIST_DIR" ]; then
  echo "Build directory not found: $DIST_DIR (run pnpm build first)" >&2
  exit 1
fi

FLAGS=()
[ "${DEPLOY_PUBLIC:-0}" = "1" ] && FLAGS+=("--public")
[ "${DEPLOY_SPA:-0}" = "1" ] && FLAGS+=("--spa")

REMOTE_TMP="/tmp/quick-deploy-${DEPLOY_SLUG}-$$"
SSH_OPTS=(-i "$DEPLOY_SSH_KEY" -o StrictHostKeyChecking=no)

ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "rm -rf '$REMOTE_TMP' && mkdir -p '$REMOTE_TMP'"
COPYFILE_DISABLE=1 tar -czf - -C "$DIST_DIR" . | ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "tar -xzf - -C '$REMOTE_TMP'"
ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "/opt/apps/bin/quick-deploy-static '$DEPLOY_SLUG' '$REMOTE_TMP' ${FLAGS[*]:-} && rm -rf '$REMOTE_TMP'"
