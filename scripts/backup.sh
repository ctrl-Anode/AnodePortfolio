#!/bin/sh
# Scheduled backup for MySQL and the Meilisearch users index.
# Runs inside the `backup` compose service; output lands in the backup_data volume.
set -eu

BACKUP_DIR=${BACKUP_DIR:-/backup}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
WORK_DIR="$BACKUP_DIR/.tmp-$STAMP"

mkdir -p "$WORK_DIR"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# --- MySQL -------------------------------------------------------------------
log "Dumping MySQL database '$MYSQL_DATABASE'..."
if mysqldump \
  -h "${MYSQL_HOST:-mysql}" \
  -u "${MYSQL_USER:-app}" \
  -p"${MYSQL_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  "${MYSQL_DATABASE}" > "$WORK_DIR/mysql-$STAMP.sql"; then
  log "MySQL dump OK ($(wc -c < "$WORK_DIR/mysql-$STAMP.sql") bytes)"
else
  log "ERROR: MySQL dump failed"
  exit 1
fi

# --- Meilisearch -------------------------------------------------------------
if [ -n "${MEILI_HOST:-}" ]; then
  log "Requesting Meilisearch snapshot..."
  if curl -fsS -X POST "${MEILI_HOST}/indexes/users/snapshots" \
    -H "Authorization: Bearer ${MEILI_MASTER_KEY}" > "$WORK_DIR/meili-snapshot.json" 2>/dev/null; then
    log "Meilisearch snapshot queued"
  else
    log "WARN: Meilisearch snapshot failed (search is a soft dependency - continuing)"
  fi
fi

# --- Local uploads -----------------------------------------------------------
if [ -d /app/storage ] && [ -n "$(ls -A /app/storage 2>/dev/null)" ]; then
  log "Archiving local uploads..."
  tar czf "$WORK_DIR/storage-$STAMP.tar.gz" -C /app/storage . 2>/dev/null || log "WARN: upload archive failed"
else
  log "No local uploads to archive"
fi

# --- Finalise ----------------------------------------------------------------
ARCHIVE="$BACKUP_DIR/backup-$STAMP.tar.gz"
tar czf "$ARCHIVE" -C "$WORK_DIR" . || {
  log "ERROR: could not finalise archive"
  exit 1
}
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"

log "Backup complete: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# --- Retention ---------------------------------------------------------------
log "Pruning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -maxdepth 1 -name 'backup-*.tar.gz*' -type f -mtime "+$RETENTION_DAYS" -print -delete || true