#!/bin/sh
# Container entrypoint: apply committed migrations (and optionally seed) before
# handing off to the main process. Used by the single-image deployment and the
# docker-compose `api` service if wired up.
set -e

echo "[entrypoint] applying database migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "[entrypoint] seeding database (idempotent)..."
  node prisma/seed.js
fi

echo "[entrypoint] starting: $*"
exec "$@"
