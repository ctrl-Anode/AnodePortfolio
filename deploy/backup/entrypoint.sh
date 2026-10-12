#!/bin/sh
# Run a backup immediately, then on a fixed interval.
set -eu

echo "Backup service starting (interval: ${BACKUP_INTERVAL_SECONDS}s)."

while true; do
  /scripts/backup.sh || echo "[backup] run failed; will retry next cycle" >&2
  sleep "${BACKUP_INTERVAL_SECONDS:-14400}"
done