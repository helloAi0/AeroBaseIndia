# AeroBase India — Launch Checklist (verified status)

Legend: ✅ verified by automated/browser/curl tests · ⚠️ built but NOT verified end-to-end · ⬜ you must do

## Before first deploy (⬜ you)
- [ ] `openssl rand -hex 32` → `JWT_SECRET`; set a strong `DB_PASSWORD` / `REDIS_PASSWORD` (`deploy/.env.prod`, never commit)
- [ ] Rotate anything that was ever committed: the old `.env` and `certs/server.key` are still in git history. Make the repo private or purge history (`git filter-repo`), and issue a new TLS key.
- [ ] Rotate the Twilio auth token and Google API key that were pasted in chat
- [ ] Set `PUBLIC_API_URL` to your backend's public https URL
- [ ] Create the first admin: `DB_PASSWORD=… scripts/create_user.py --email … --name … --role SUPER_ADMIN --airport DEL` (a tenant row with that airport_code must exist)
- [ ] Put the backend behind HTTPS (nginx/Caddy/Cloudflare). Restrict CORS (currently `*`)

## Verified ✅
- Real JWT login (PBKDF2, legacy-hash upgrade, expiry, weak-secret refusal in production)
- `/flights` requires a token; tenant comes from the token
- `/notify/*` requires an admin token; Telegram / Brevo / Twilio paths against mock servers
- DB auto-reconnect after Postgres restart; honest `/health` (DB, Redis, ML)
- All migrations apply cleanly on a fresh DB and are re-runnable
- Frontend: all 42 admin pages + every role open without errors (desktop + 390px mobile), logout/refresh/back work
- Production bundle contains no demo passwords; service worker caches shell offline (production build)

## Built but not verified ⚠️
- Docker images (`Dockerfile`, `ml_service/Dockerfile`, `frontend/Dockerfile.frontend`) and `deploy/docker-compose.prod.yml`: the build sandbox could not reach Docker Hub. Run `docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml up -d --build` and watch the first build.
- Kubernetes manifests (probe path fixed to `/health`; secrets must be created out-of-band)
- 3D scenes on a real GPU; real Twilio/Telegram/Brevo/WhatsApp delivery; real Open-Meteo data
- Billing/payment endpoints beyond SQL-schema compatibility (migration 038 makes their queries valid; flows not exercised)
- Password reset and email verification (not implemented). `/login` is rate-limited per process (5 failures per IP+email, 30 per IP, per 15 min); behind a proxy all users share the proxy IP, so also rate-limit at the proxy

## Known limitations
- AI delay prediction uses a rule-of-thumb until you train a model (`/data/training_data.csv`)
- Carbon, baggage-ETA and biometric pages are estimates/demos and are labelled as such
- Demo data is used when no backend is configured (`VITE_API_URL` unset)
