# Connecting payments, WhatsApp, SMS, Telegram and email (all have free tiers)

These services need an account in **your** name, so the keys cannot ship with the code. Each takes ~10 minutes.
Easiest way to enter them: `bash scripts/configure-keys.sh` (asks for each, writes `deploy/.env.local`, never prints them).
Then restart: `bash scripts/run-local.sh` (or set the same names in the Render/Vercel dashboard). Check the result in the app under **Integrations** (green = connected, and you can send a test message there).

| Service | Free option | Variables | Where to get them |
|---|---|---|---|
| **Payments (India)** | Razorpay **test mode** (free, no KYC needed for test) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | dashboard.razorpay.com → Settings → API Keys (Test Mode). Webhook: Settings → Webhooks → URL `https://YOUR-API/payments/webhook/razorpay`, choose a secret. |
| Payments (international) | Stripe test mode | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Developers → API keys / Webhooks (`/payments/webhook/stripe`). |
| **WhatsApp** | Meta WhatsApp Cloud API test number (free) | `WHATSAPP_VERIFY_TOKEN` (any string you choose), `WHATSAPP_APP_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | developers.facebook.com → Create app → add WhatsApp. Webhook URL `https://YOUR-API/webhooks/whatsapp`, subscribe to `messages`. |
| **Telegram alerts** (free forever, no registration) | Telegram bot | `TELEGRAM_BOT_TOKEN` | Message **@BotFather** → `/newbot`. Use the chat id of the person/group as recipient. |
| **SMS** | Twilio trial (verified numbers only) — for India production use a DLT-registered gateway | `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | twilio.com/console |
| **Email** | Brevo free (300 mails/day) | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (a sender you verified in Brevo) | app.brevo.com → SMTP & API → API keys; Senders → add & verify. |
| Biometric (passkeys) | built in, no key | `WEBAUTHN_ORIGINS` = your website's origin(s), e.g. `https://aerobase.vercel.app` | — |

Security rules: never paste keys into chat, issues or commits; rotate any key that was ever shared; use test/trial keys until you go live.
The secret scanner (`scripts/check-secrets.sh`) blocks commits that contain keys.
