#!/usr/bin/env bash
# One-command local run on Ubuntu (Docker based). From the repo root:
#   bash scripts/run-local.sh          # start everything, seed data, print logins
#   bash scripts/run-local.sh test     # run unit + integration tests against the running stack
#   bash scripts/run-local.sh stop     # stop everything
set -euo pipefail
cd "$(dirname "$0")/.."
ENVF=deploy/.env.local
COMPOSE=(docker compose --env-file "$ENVF" -f deploy/docker-compose.prod.yml)
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo-Pass-2026x}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing '$1'. $2"; exit 1; }; }
need docker "Install: sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2 && sudo usermod -aG docker \$USER (then log out/in)"
need python3 "Install: sudo apt-get install -y python3"
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 missing: sudo apt-get install -y docker-compose-v2"; exit 1; }

case "${1:-up}" in
  stop) "${COMPOSE[@]}" down; pkill -f "vite.*5173" 2>/dev/null || true; echo "Stopped."; exit 0;;
  test) need node "Install Node 20+: https://nodejs.org or sudo apt-get install -y nodejs npm"
        DEMO_PASSWORD="$DEMO_PASSWORD" bash scripts/run-tests.sh; exit 0;;
esac

if [ ! -f "$ENVF" ]; then
  umask 077
  cat > "$ENVF" <<EOT
DB_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
PUBLIC_API_URL=http://localhost:8080
WEBAUTHN_ORIGINS=http://localhost:3000,http://localhost:5173
SMS_PROVIDER=log
EOT
  echo "Created $ENVF with fresh random secrets (local only; git-ignored)."
fi

echo "== Building and starting backend, database, Redis, ML service, frontend (first build takes ~10-15 min) =="
"${COMPOSE[@]}" up -d --build

echo "== Waiting for the API =="
for i in $(seq 1 90); do curl -fsS http://localhost:8080/health >/dev/null 2>&1 && break; sleep 3; done
curl -fsS http://localhost:8080/health >/dev/null || { echo "API did not become healthy. Logs: ${COMPOSE[*]} logs backend"; exit 1; }

echo "== Applying migrations and loading real reference data + demo airports/users =="
PGC=$("${COMPOSE[@]}" ps -q postgres)
for f in $(ls migrations/*.sql | sort); do docker exec -i "$PGC" psql -q -U postgres -d aerobase -v ON_ERROR_STOP=0 < "$f" >/dev/null 2>&1 || true; done
SEED_VIA_DOCKER="$PGC" DEMO_PASSWORD="$DEMO_PASSWORD" python3 scripts/seed_demo.py

echo
echo "API:       http://localhost:8080/health"
echo "Frontend:  http://localhost:3000   (production build served by nginx)"
echo "Logins (password: $DEMO_PASSWORD):"
echo "  admin@del.aerobase.in   staff@del.aerobase.in   security@del.aerobase.in"
echo "  ops@vistara.del.aerobase.in (airline)   captain@airindia.del.aerobase.in (pilot)"
echo "  shop@del.aerobase.in (retailer)   passenger@del.aerobase.in   owner@aerobase.in (platform owner)"
echo "Run the tests:  bash scripts/run-local.sh test      Stop:  bash scripts/run-local.sh stop"
