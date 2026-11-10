#!/usr/bin/env bash
# Apply all migrations to an existing database (idempotent). Needs psql and the DB_* env vars.
set -euo pipefail
cd "$(dirname "$0")/../migrations"
export PGPASSWORD="${DB_PASSWORD:?set DB_PASSWORD}"
for f in $(ls *.sql | sort); do
  echo "applying $f"
  psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-aerobase}" -v ON_ERROR_STOP=1 -q -f "$f"
done
