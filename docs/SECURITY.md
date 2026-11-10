# Security & secrets runbook

## What was in git history (audited)
An early commit contained `.env` and `certs/server.{crt,key}`. I inspected them (values masked):
- `.env` held only **placeholders** (`change_me…`, `postgres`, `replace_me`), no real credentials.
- The certificate is a **self-signed `CN=localhost`** development cert, not tied to any domain.

So nothing of real value leaked, and rewriting history was judged unnecessary (a force-push would break every clone/PR for no gain).
Rule going forward: never reuse those placeholder values or that key. If you later decide to purge anyway: `git filter-repo --path .env --path certs --invert-paths`, then force-push all branches (GitHub may keep cached views until you contact Support).

## Guardrails now in the repo
- `scripts/check-secrets.sh` + `.github/workflows/secret-scan.yml`: CI fails if a key/env file or a known secret pattern (Google/AWS/Twilio/Stripe/Razorpay/GitHub/Slack/Telegram/Brevo keys, private keys) is committed.
- `scripts/install-hooks.sh`: installs the same check as a local pre-commit hook (`scripts/install-hooks.sh` once per clone).
- Backend refuses to start with `AEROBASE_ENV=production` unless `JWT_SECRET`, `DB_PASSWORD` (≥ 12 chars, no default words) and `DB_HOST` are set.
- `deploy/.env.prod` is git-ignored; generate it with `scripts/init-prod-env.sh <public-api-url>` (random 256-bit JWT secret, 32-char DB/Redis passwords, file mode 600).
- Demo accounts/passwords are stripped from production frontend builds.

## Rotate the Twilio Auth Token (only you can do this — it needs your Twilio login)
1. Twilio Console → **Account → API keys & tokens**.
2. Under **Auth Tokens**, create a **Secondary** token, update `TWILIO_AUTH_TOKEN` on the server, restart the backend.
3. Promote the secondary token to primary (this invalidates the old, exposed one).
4. Better still: create an **API Key** (SID `SK…` + secret) instead of using the main Auth Token, and store only that.
Also rotate any other credential you pasted into chat or a screenshot (Google API key `AIza…` → Google Cloud Console → APIs & Services → Credentials → delete/regenerate and add restrictions).

## Rotating secrets later
| Secret | Effect of rotating | How |
|---|---|---|
| `JWT_SECRET` | all users are logged out | change value, restart backend |
| `DB_PASSWORD` | must match inside Postgres | `ALTER USER postgres PASSWORD '…'`, update env, restart |
| `REDIS_PASSWORD` | cache reconnect | update env, restart redis + backend |
