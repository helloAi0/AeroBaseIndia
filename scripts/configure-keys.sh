#!/usr/bin/env bash
# Interactive: writes your service keys to deploy/.env.local (git-ignored, chmod 600). Press Enter to skip a service.
set -euo pipefail
cd "$(dirname "$0")/.."
F=deploy/.env.local; touch "$F"; chmod 600 "$F"
setv() { local k="$1" v="$2"; grep -v "^$k=" "$F" > "$F.tmp" || true; printf '%s=%s\n' "$k" "$v" >> "$F.tmp"; mv "$F.tmp" "$F"; chmod 600 "$F"; }
ask() { local k="$1" label="$2" secret="${3:-1}" v=""; if [ "$secret" = 1 ]; then read -r -s -p "$label: " v; echo; else read -r -p "$label: " v; fi; [ -n "$v" ] && setv "$k" "$v" && echo "  saved $k" || true; }
echo "Keys are stored only in $F. See docs/SETUP_KEYS.md for where to get each one. Enter = skip."
echo "== Razorpay (test mode) =="; ask RAZORPAY_KEY_ID "Key ID" 0; ask RAZORPAY_KEY_SECRET "Key secret"; ask RAZORPAY_WEBHOOK_SECRET "Webhook secret"
echo "== Stripe =="; ask STRIPE_SECRET_KEY "Secret key"; ask STRIPE_WEBHOOK_SECRET "Webhook secret"
echo "== WhatsApp Cloud API =="; ask WHATSAPP_VERIFY_TOKEN "Verify token (any string)" 0; ask WHATSAPP_APP_SECRET "App secret"; ask WHATSAPP_TOKEN "Access token"; ask WHATSAPP_PHONE_NUMBER_ID "Phone number ID" 0
echo "== Telegram =="; ask TELEGRAM_BOT_TOKEN "Bot token"
echo "== SMS (Twilio) =="; read -r -p "Use Twilio? [y/N] " t; if [ "${t:-n}" = y ]; then setv SMS_PROVIDER twilio; ask TWILIO_ACCOUNT_SID "Account SID" 0; ask TWILIO_AUTH_TOKEN "Auth token"; ask TWILIO_FROM "From number (+1...)" 0; fi
echo "== Email (Brevo) =="; ask BREVO_API_KEY "API key"; ask BREVO_SENDER_EMAIL "Verified sender email" 0
ask WEBAUTHN_ORIGINS "Your website origin(s) for passkeys, comma separated" 0
echo "Done. Restart:  bash scripts/run-local.sh   then open Integrations in the app."
