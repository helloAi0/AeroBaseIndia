# SMS alerts

`POST /notify/sms` (admin JWT) `{"to":["+91..."],"message":"..."}` — max 50 numbers, 320 chars, 60 messages/min per airport.
`GET /notify/sms/status` shows the active provider.

Configure with environment variables only (never commit them):

| Variable | Meaning |
|---|---|
| `SMS_PROVIDER` | `log` (default, dry run — sends nothing) or `twilio` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | from the Twilio console |
| `TWILIO_MESSAGING_SERVICE_SID` or `TWILIO_FROM` | sender |

## Going past the Twilio trial (production checklist)
Trial accounts only message numbers you have verified and prefix every message. To remove that:
1. Upgrade the Twilio account (add billing).
2. **India:** SMS to Indian numbers requires TRAI DLT registration (entity, sender ID/header, message templates). Without it, messages are blocked by carriers regardless of plan. Register through Twilio's India onboarding or an Indian DLT provider.
3. Use a Messaging Service (`TWILIO_MESSAGING_SERVICE_SID`) rather than a single number.
4. If Twilio is not a fit, add a branch for an India-native gateway in `SmsService::send` (same env-var approach).

## Free alternative: Telegram bot (no billing, no DLT)
`POST /notify/telegram` (admin JWT) `{"to":["<chat id>"],"message":"..."}`.
1. In Telegram, message **@BotFather** → `/newbot` → copy the token.
2. Set `TELEGRAM_BOT_TOKEN` on the server (env only).
3. Each recipient opens your bot and presses **Start** once (bots cannot message people first). Their chat id is shown by messaging @userinfobot, or read from the bot's `getUpdates`.
Limits: ~30 messages/second overall, 1/second per chat. Free permanently.
