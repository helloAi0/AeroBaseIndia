#!/bin/sh
# Container start for hosted deployments: set the port, prepare the database, then run the server.
set -eu
PORT="${PORT:-8080}"
mkdir -p /tmp/aerobase && cd /tmp/aerobase
sed "s/\"port\": 8080/\"port\": ${PORT}/" /app/config.json > config.json
# If DATABASE_URL (postgres://user:pass@host:port/db) is set, it wins over the separate DB_* values (handy for Neon or Supabase).
if [ -n "${DATABASE_URL:-}" ]; then
  eval "$(python3 - <<'PY'
import os, shlex
from urllib.parse import urlparse, unquote
u = urlparse(os.environ["DATABASE_URL"])
for k, v in (("DB_HOST", u.hostname), ("DB_PORT", u.port or 5432), ("DB_USER", unquote(u.username or "")), ("DB_PASSWORD", unquote(u.password or "")), ("DB_NAME", (u.path or "/").lstrip("/"))):
    print(f"export {k}={shlex.quote(str(v))}")
PY
)"
fi
python3 /app/scripts/bootstrap.py --no-seed || echo "bootstrap failed; starting anyway"
# The demo seed and the once-an-hour new-day check run in the background so the server answers health checks straight away.
( python3 /app/scripts/bootstrap.py --daily; while true; do sleep 3600; python3 /app/scripts/bootstrap.py --daily; done ) &
exec /app/AeroBaseIndia
