#!/usr/bin/env bash
# Generates deploy/.env.prod with strong random secrets. Run it ON THE SERVER; the file never leaves it.
#   scripts/init-prod-env.sh https://api.your-domain.example
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=deploy/.env.prod
[ -e "$OUT" ] && { echo "$OUT already exists — refusing to overwrite (delete it first to regenerate)"; exit 1; }
API_URL="${1:-}"
[ -z "$API_URL" ] && read -rp "Public backend URL (e.g. https://api.example.com): " API_URL
command -v openssl >/dev/null || { echo "openssl is required"; exit 1; }
rand() { openssl rand -base64 48 | tr -d '/+=\n' | cut -c1-"$1"; }
umask 077
cat > "$OUT" <<EOF
DB_PASSWORD=$(rand 32)
REDIS_PASSWORD=$(rand 32)
JWT_SECRET=$(openssl rand -hex 32)
PUBLIC_API_URL=$API_URL
SMS_PROVIDER=log
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
TELEGRAM_BOT_TOKEN=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
EOF
echo "Created $OUT (mode 600) with new DB_PASSWORD, REDIS_PASSWORD and JWT_SECRET."
echo "Next: docker compose --env-file $OUT -f deploy/docker-compose.prod.yml up -d --build"
echo "Note: changing JWT_SECRET later logs everyone out; changing DB_PASSWORD on an existing volume also requires ALTER USER."
