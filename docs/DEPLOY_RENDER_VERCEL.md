# Deploy AeroBase India: Render (backend) + Vercel (frontend)

Everything here runs on free plans. Read "What free means" first so nothing surprises you in the demo.

## What free means
- **Render free web services sleep after 15 minutes without traffic** and take about a minute to wake. Open the site once before you show it, or keep it awake (step 6).
- **Render free Postgres expires 30 days after it is created.** For a longer life use Neon instead (Option B in step 2). It is free and does not expire.
- **The first build takes about 10 to 15 minutes** (it compiles the C++ server). Later deploys reuse the cache.
- The first start also creates today's flights for 20 airports and the demo logins. That runs in the background and takes 2 to 4 minutes, so the board is empty for a few minutes after the very first deploy.

## 1. Put the code on GitHub
Already done: https://github.com/helloAi0/AeroBaseIndia. You can make the repository private; Render and Vercel can still deploy from it once you give them access.

## 2. Backend on Render
1. Create a free account at render.com and connect your GitHub account.
2. **New > Blueprint**, choose the repository. Render reads `render.yaml` and proposes four things: `aerobase-api` (the server), `aerobase-ml` (delay predictions), `aerobase-redis` and `aerobase-db`.
3. It asks for the values marked "set":
   - `DEMO_PASSWORD`: a password of 10 or more characters for the demo accounts (write it down; you also need it in Vercel).
   - Leave `CORS_ORIGINS`, `PUBLIC_APP_URL`, `WEBAUTHN_ORIGINS` empty for now. You fill them in step 4.
   - `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`: optional (real password-reset emails). Leave empty and the reset page shows the link on screen instead.
4. **Apply**. When `aerobase-api` shows "Live", open `https://<your-api>.onrender.com/health`. You should see `"database":"UP"`.

**Option B: Neon instead of Render Postgres (does not expire).** Create a free project at neon.tech, copy the connection string, and on `aerobase-api` add `DATABASE_URL` = that string and `DB_SSLMODE` = `require`. Then delete `aerobase-db` from the dashboard. `DATABASE_URL` takes priority over the separate `DB_*` values.

## 3. Frontend on Vercel
1. Create a free account at vercel.com, **Add New > Project**, import the same repository.
2. Set **Root Directory** to `frontend`. Vercel detects Vite; `frontend/vercel.json` already holds the build settings.
3. Add Environment Variables (see `frontend/.env.production.example`):
   - `VITE_API_URL` = your Render API address, for example `https://aerobase-api.onrender.com` (no trailing slash)
   - `VITE_SHOW_DEMO_ACCOUNTS` = `true` (shows the "try a demo account" buttons; they only fill the form)
   - `VITE_DEMO_PASSWORD` = the same value as `DEMO_PASSWORD` on Render
4. **Deploy**. Note the address Vercel gives you, for example `https://aerobase.vercel.app`.

## 4. Connect the two (this is the step people forget)
On Render, open `aerobase-api` > Environment and set:
- `CORS_ORIGINS` = `https://aerobase.vercel.app` (your Vercel address, no trailing slash; several allowed, comma separated)
- `PUBLIC_APP_URL` = the same address (used in password-reset links)
- `WEBAUTHN_ORIGINS` = the same address (passkeys only work from this origin)

Save. Render restarts the server. Until `CORS_ORIGINS` is set the API accepts requests from any site, which also works; setting it locks it to yours.

## 5. Check it works
Open your Vercel address, then:
1. Sign in with `admin@del.aerobase.in` and your `DEMO_PASSWORD` (other roles: staff@, security@, head.security@, passenger@, shop@, captain@airindia., ops.6e@ ... all with the `@del.aerobase.in` style address; the platform owner is `owner@aerobase.in`).
2. The flight board should list flights. If it is empty, wait a few minutes after the first deploy and refresh.
3. As the passenger, open My Trips and book a flight.

## 6. Keep it awake for a demo
Create a free monitor at uptimerobot.com for `https://<your-api>.onrender.com/health` every 5 minutes. This keeps the free server from sleeping.

## Going from demo to real
- Set `SEED_DEMO` to `false` on Render and `VITE_SHOW_DEMO_ACCOUNTS` to `false` on Vercel, then redeploy. Real users then create their own accounts on the sign-up screen.
- Rotate every key that was ever pasted into a chat or committed (Twilio token, Google API key). Add your own with `scripts/configure-keys.sh`.
- Payments (Razorpay or Stripe) and SMS/WhatsApp need your own provider keys on Render; without them those features say "not configured" instead of pretending.

## Troubleshooting
| What you see | Cause and fix |
|---|---|
| Sign-in says it cannot reach the server | `VITE_API_URL` is wrong or missing in Vercel. Fix it and **redeploy** (it is baked in at build time). |
| Browser console shows a CORS error | `CORS_ORIGINS` on Render does not exactly match the Vercel address (https, no trailing slash). |
| First request after a while takes a minute | The free server was asleep. Use step 6. |
| `/health` shows `"database":"DOWN"` | Database not ready yet (wait) or Neon needs `DB_SSLMODE=require`. |
| Board is empty right after the first deploy | The first seed is still running (2 to 4 minutes). |
| Build fails on Render with out of memory | Retry the deploy once. If it keeps happening, the free build machine is too small for the C++ compile; ask me and I will add a pre-built image option. |
