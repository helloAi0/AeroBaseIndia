# What is real, what is sample data

Signed in to the live backend (`VITE_API_URL` set, real login), pages fall into three groups.
Pages in group 3 show a yellow "Sample data" notice so nobody mistakes them for live numbers.

## 1. Fully real (server database, role-checked, audited)
- **Login / users / roles**: PBKDF2 passwords, JWT, per-airport tenants, airline/pilot/retailer scoping (`org` claim).
- **Flights**: the board is read from PostgreSQL per airport; staff/admin update status, gate, delay (`PATCH /flights/{id}`); partner airlines push schedules with API keys.
- **Dashboard**: totals, delays, on-time %, departures per hour and passengers are computed from the flight rows. Payments are summed from real orders.
- **Ops tools** (Autopilot, What-if, Copilot, Crowd heatmap, Smart gates, Carbon ops, Playbooks, Turnaround, My Journey) run on the live board. Gate swaps change the real flight.
- **Persisted records** (`/api/records/*`): accessibility requests, lost & found, offer-marketplace bids, incidents, maintenance, contracts, parking zones, fuel orders, announcement history, approved actions.
- **Audit log**, **billing plan**, **partner API keys**, **notifications** (SMS/Telegram/email via configured providers).

## 2. Real external data
- Weather (Open-Meteo), AI delay prediction (ML service), browser voice and push.

## 3. Still sample data (UI built, not yet connected)
Analytics, Revenue, Gates dashboard, Baggage, Security, Cargo, Check-in, Biometric, Retail/Retailer dashboards, Airline & Pilot dashboards,
Passenger portal, Staff, Tenants, Wayfinding map, Scheduler, Carbon dashboard, Feedback, Emergency, Integrations, Billing portal.
Models in the ops tools use documented planning assumptions (shown on each page), not trained ML, until real telemetry is available.

## Demo vs production
`scripts/seed_demo.py` creates real rows for DEL/BOM/BLR and one user per role for investor demos. Do not run it on production data.
