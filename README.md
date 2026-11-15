<div align="center">

# ✈️ AeroBase India

### The multi-tenant operating system for airports.
One platform for the airport owner, operations director, airlines, pilots, security, ground staff, retailers and passengers.

[![Live demo](https://img.shields.io/badge/Live_demo-aero--base--india.vercel.app-d9472f?style=for-the-badge)](https://aero-base-india.vercel.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Tests](https://img.shields.io/badge/tests-63_integration_%2B_76_unit-2ea44f)
![C++20](https://img.shields.io/badge/C%2B%2B-20-00599C?logo=cplusplus&logoColor=white)
![Drogon](https://img.shields.io/badge/Drogon-HTTP%20%2B%20WS-1c1428)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-cache-DC382D?logo=redis&logoColor=white)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Tailwind-646CFF?logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/ML-Flask-000000?logo=flask&logoColor=white)

<img src="docs/screenshots/landing-hero.jpg" alt="AeroBase India landing page with interactive 3D globe" width="100%"/>

**[🚀 Open the live demo](https://aero-base-india.vercel.app)** · [Architecture](#architecture) · [Feature tour](#feature-tour) · [Run locally](#run-it-locally) · [Deploy](#deploy-free)

</div>

<div align="center">

| 9 role workspaces | 20 airports | 958 routes | 74 airlines | 45 migrations | 139 automated tests |
|:-:|:-:|:-:|:-:|:-:|:-:|

</div>

**Contents:** [Try it](#try-it-in-60-seconds) · [Why](#why-this-exists) · [Highlights](#highlights) · [Feature tour](#feature-tour) · [Architecture](#architecture) · [Tech stack](#tech-stack) · [Security](#security) · [Quality](#quality) · [Run locally](#run-it-locally) · [Deploy](#deploy-free) · [Roadmap](#roadmap) · [Contributing](#contributing) · [License](#license)

---

## Try it in 60 seconds

**👉 https://aero-base-india.vercel.app**

The API runs on a free tier and sleeps when idle, so the **first sign-in can take about a minute** while it wakes up. After that it is fast. On a fresh deploy the flight board fills within a few minutes of the first start.

| Role | Email | What you will see |
|---|---|---|
| Airport director | `admin@del.aerobase.in` | Ops dashboard, gates, baggage, what-if, autopilot, analytics |
| Ground staff | `staff@del.aerobase.in` | Passenger desk, ID and bag pre-checks, baggage |
| Security | `security@del.aerobase.in` | Screening and hold pre-checks |
| Security head | `head.security@del.aerobase.in` | Command view |
| Airline ops | `ops.6e@del.aerobase.in` | Crew, bookings, airline operations |
| Pilot | `captain@airindia.del.aerobase.in` | Briefing, assigned flights, messages |
| Retailer | `shop@del.aerobase.in` | Orders, products, settings |
| Passenger | `passenger@del.aerobase.in` | Book a flight, trips, food, lounges, bags |
| Platform owner | `owner@aerobase.in` | All airports and tenants |

Demo password (the sign-in page also lists the accounts): `Demo-Pass-2026x`. These are public demo accounts on seeded data. Production builds can hide them with `VITE_SHOW_DEMO_ACCOUNTS=false`.

---

## Why this exists

An airport is dozens of organisations sharing one runway, and most run on separate tools. A delayed flight touches gates, baggage, security queues, crew, retail and passengers, and each of them hears about it at a different time.

AeroBase puts all of them on one tenant-aware data model and one live board:

- **One source of truth.** Flights, gates, crew, bags, bookings and orders live in one database, scoped per airport.
- **Role-shaped product.** Each role signs in to a different workspace with only what it needs and is allowed to see.
- **Enforced in the backend.** Role policies, booking gates and ownership are checked server-side, not hidden in the UI.

---

## Highlights

- **Passenger journey with real gates.** Book, check in, drop bag, clear security and board, in that order. The API rejects skipped steps with `409`.
- **Ground staff and security pre-checks.** ID and bag verification, then screen or hold, recorded against the booking.
- **Disruption tooling.** What-if simulation, a disruption autopilot and an ops copilot on top of live flight, gate and crew data.
- **Delay prediction.** A Flask ML service scores flights; the API calls it for the board.
- **Multi-currency.** Fares and prices shown in INR, AED, QAR, GBP or SGD depending on the airport.
- **Multi-tenant by design.** Every airport is a tenant; platform owners see across tenants, everyone else only their own.
- **Developer friendly.** Built-in API tester, GraphQL explorer and OpenAPI docs.
- **One-command deploy.** Render Blueprint plus Vercel; migrations and data bootstrap themselves on first start.

---

## Feature tour

### Landing and onboarding

<table>
<tr>
<td width="50%"><img src="docs/screenshots/landing-roles.jpg" alt="Roles section"/><br/><sub><b>Built for every role</b> on one platform</sub></td>
<td width="50%"><img src="docs/screenshots/landing-inside.jpg" alt="Inside the product"/><br/><sub><b>Inside the product</b> preview</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/signin.jpg" alt="Sign in"/><br/><sub><b>Sign in</b> with role-based demo accounts and passkey support</sub></td>
<td><img src="docs/screenshots/mobile-landing.jpg" alt="Mobile landing" width="240"/><br/><sub><b>Responsive</b> down to phone width</sub></td>
</tr>
</table>

The hero is a real-time three.js scene: dotted continents generated from Natural Earth data, an atmosphere shader, hub rings, animated flight arcs with aircraft models, an orbiting satellite and pointer parallax.

### Airport director and operations

<img src="docs/screenshots/director-dashboard.jpg" alt="Director dashboard" width="100%"/>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/director-flights.jpg" alt="Flights"/><br/><sub><b>Live flight board</b></sub></td>
<td width="50%"><img src="docs/screenshots/director-gates.jpg" alt="Gates"/><br/><sub><b>Gate allocation</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-baggage.jpg" alt="Baggage"/><br/><sub><b>Baggage tracking</b></sub></td>
<td><img src="docs/screenshots/director-turnaround.jpg" alt="Turnaround"/><br/><sub><b>Turnaround</b> progress</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-whatif.jpg" alt="What-if"/><br/><sub><b>What-if simulator</b></sub></td>
<td><img src="docs/screenshots/director-disruption-autopilot.jpg" alt="Disruption autopilot"/><br/><sub><b>Disruption autopilot</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-ops-copilot.jpg" alt="Ops copilot"/><br/><sub><b>Ops copilot</b></sub></td>
<td><img src="docs/screenshots/director-crowd.jpg" alt="Crowd"/><br/><sub><b>Crowd</b> density</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-smart-gates.jpg" alt="Smart gates"/><br/><sub><b>Smart gates</b></sub></td>
<td><img src="docs/screenshots/director-weather-playbooks.jpg" alt="Weather playbooks"/><br/><sub><b>Weather playbooks</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-carbon.jpg" alt="Carbon"/><br/><sub><b>Carbon</b> reporting</sub></td>
<td><img src="docs/screenshots/director-accessibility.jpg" alt="Accessibility"/><br/><sub><b>Accessibility</b> requests linked to bookings</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-analytics.jpg" alt="Analytics"/><br/><sub><b>Analytics</b></sub></td>
<td><img src="docs/screenshots/director-revenue.jpg" alt="Revenue"/><br/><sub><b>Revenue</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/director-team.jpg" alt="Team"/><br/><sub><b>Team</b> management</sub></td>
<td><img src="docs/screenshots/director-pass-requests.jpg" alt="Pass requests"/><br/><sub><b>Pass requests</b> approvals</sub></td>
</tr>
</table>

### Ground staff and security: pre-check flow

Passengers cannot move to the next stage until the checks are done. The backend returns `409` if a stage is skipped.

`Booked → Checked in → Bag dropped → Security cleared → Boarded`

<table>
<tr>
<td width="50%"><img src="docs/screenshots/staff-passenger-desk.jpg" alt="Passenger desk"/><br/><sub><b>Passenger desk</b>: ID and bag checks</sub></td>
<td width="50%"><img src="docs/screenshots/security-prechecks.jpg" alt="Security pre-checks"/><br/><sub><b>Security</b>: screen or hold</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/security-head-command.jpg" alt="Security head command"/><br/><sub><b>Security head</b> command view</sub></td>
<td><img src="docs/screenshots/staff-baggage.jpg" alt="Staff baggage"/><br/><sub><b>Baggage</b> handling</sub></td>
</tr>
</table>

### Pilots and airlines

<table>
<tr>
<td width="50%"><img src="docs/screenshots/pilot-briefing.jpg" alt="Pilot briefing"/><br/><sub><b>Pilot briefing</b>, with a clear message when assigned flights are not on today's board</sub></td>
<td width="50%"><img src="docs/screenshots/airline-crew.jpg" alt="Airline crew"/><br/><sub><b>Crew</b> management and stamping</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/airline-ops.jpg" alt="Airline ops"/><br/><sub><b>Airline operations</b></sub></td>
</tr>
</table>

### Retailers

<table>
<tr>
<td width="50%"><img src="docs/screenshots/shop-workspace.jpg" alt="Shop workspace"/><br/><sub><b>Shop workspace</b></sub></td>
<td width="50%"><img src="docs/screenshots/shop-orders.jpg" alt="Shop orders"/><br/><sub><b>Orders</b> accept, fulfil, cancel</sub></td>
</tr>
<tr>
<td colspan="2"><img src="docs/screenshots/shop-products.jpg" alt="Shop products"/><br/><sub><b>Products</b> and stock, with stock decremented server-side</sub></td>
</tr>
</table>

### Passengers

<table>
<tr>
<td width="50%"><img src="docs/screenshots/passenger-book-flight.jpg" alt="Book a flight"/><br/><sub><b>Book a flight</b> with a quote, seats and PNR</sub></td>
<td width="50%"><img src="docs/screenshots/passenger-my-trips.jpg" alt="My trips"/><br/><sub><b>My trips</b> and check-in</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/passenger-journey.jpg" alt="Journey"/><br/><sub><b>Journey</b> tracker</sub></td>
<td><img src="docs/screenshots/passenger-bags.jpg" alt="Bags"/><br/><sub><b>My bags</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/passenger-food-ordering.jpg" alt="Food ordering"/><br/><sub><b>Shops and food</b> ordering to the gate</sub></td>
<td><img src="docs/screenshots/passenger-lounges-pro.jpg" alt="Lounges"/><br/><sub><b>Lounges</b> and Pro</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/passenger-assistance.jpg" alt="Assistance"/><br/><sub><b>Assistance</b> requests</sub></td>
<td><img src="docs/screenshots/passenger-lost-found.jpg" alt="Lost and found"/><br/><sub><b>Lost and found</b></sub></td>
</tr>
</table>

### Platform owner and developers

<table>
<tr>
<td width="50%"><img src="docs/screenshots/owner-platform.jpg" alt="Owner platform"/><br/><sub><b>Platform owner</b> overview</sub></td>
<td width="50%"><img src="docs/screenshots/owner-airports.jpg" alt="Owner airports"/><br/><sub><b>Airports and tenants</b></sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/dev-api-tester.jpg" alt="API tester"/><br/><sub><b>API tester</b> built in</sub></td>
<td><img src="docs/screenshots/dev-graphql.jpg" alt="GraphQL"/><br/><sub><b>GraphQL</b> explorer</sub></td>
</tr>
</table>

---

## Architecture

```mermaid
flowchart LR
  subgraph Client
    FE["React + TypeScript + Vite + Tailwind<br/>(Vercel)"]
  end
  subgraph API["Drogon C++20 API (Render)"]
    REST["REST controllers"]
    GQL["GraphQL"]
    WS["WebSocket realtime"]
    POL["Role policies and JWT"]
  end
  subgraph Data
    PG[("PostgreSQL<br/>tenant-scoped")]
    RD[("Redis<br/>cache")]
  end
  ML["Flask ML service<br/>delay prediction"]
  EXT["Open-Meteo weather"]

  FE -- HTTPS --> REST
  FE -- HTTPS --> GQL
  FE -- WSS --> WS
  REST --> POL
  POL --> PG
  POL --> RD
  REST --> ML
  FE --> EXT
```

**Request path.** The browser sends a JWT carrying `user_id`, `tenant_id`, `role`, airport and org. Drogon verifies it, applies the per-collection policy, and queries PostgreSQL scoped to the tenant.

**Generic record store.** Many collections (bookings, passes, lost and found, orders and more) sit in `app_records(collection, data jsonb, created_by, created_at)`. Each collection has a policy for who may read, create and modify, and whether reads are limited to the creator's own rows. Business-critical flows have dedicated server-side handlers.

### Server-side business rules

| Flow | Enforced in the backend |
|---|---|
| Booking | Quote calculation, seat and PNR assignment, payment state, cancel |
| Journey stages | Order and gating of check-in, bag drop, security, boarding (`409` on violation) |
| Pre-checks | ID and bag by ground staff; screen or hold by security |
| Shop orders | Stock decrement and status transitions |
| Crew | Stamping and dispatch |

Fares are indicative: computed from great-circle distance with low-cost-carrier rates, shown in the airport's local currency (INR, AED, QAR, GBP, SGD), with a 10% discount for approved Pro passes.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | C++20, Drogon, pqxx, jwt-cpp |
| Database | PostgreSQL with 45 migrations, Redis |
| Realtime | WebSocket |
| API | REST, GraphQL, OpenAPI (Swagger) |
| Frontend | React, TypeScript, Vite, Tailwind CSS, three.js |
| ML | Python, Flask (delay prediction) |
| Weather | Open-Meteo (no key required) |
| Infra | Docker, Render Blueprint, Vercel, GitHub Actions |

### Data

Reference data covers **20 airports** (15 in India, 5 overseas: DXB, AUH, DOH, LHR, SIN), **958 routes** and **74 airlines**. The demo seed adds users, a day of flights, crew and dispatch for each airport.

---

## Security

- **Auth.** JWT with role, tenant and airport claims; passkey (WebAuthn) support.
- **Authorisation.** Per-collection read, create and modify policies enforced in the API, not only the UI.
- **Tenant isolation.** Data is scoped by tenant on every query path.
- **Secrets.** `scripts/check-secrets.sh` runs locally (pre-commit hook) and in CI; it fails on known key patterns and env files.
- **Production guard.** With `AEROBASE_ENV=production` the server refuses to start without a strong `JWT_SECRET`, `DB_PASSWORD` and `DB_HOST`.
- **CORS.** Strict allow-list via `CORS_ORIGINS`.
- **Frontend.** Security headers set in `frontend/vercel.json`; demo accounts can be stripped from production builds.

See [docs/SECURITY.md](docs/SECURITY.md) for the runbook and rotation steps.

---

## Quality

- **63 integration tests** against a real database (`scripts/integration_test.py`), covering auth, role policies, booking, pre-checks and orders.
- **76 frontend unit tests** with Vitest.
- **CI** in GitHub Actions: build, lint, security scan and secret scan.

```bash
bash scripts/run-local.sh test      # against a running local stack
cd frontend && npx vitest run       # unit tests
```

---

## Run it locally

Requires Docker with Compose v2, Python 3 and Node 20+.

```bash
git clone https://github.com/helloAi0/AeroBaseIndia.git
cd AeroBaseIndia
bash scripts/run-local.sh           # starts the stack, seeds data, prints logins
bash scripts/run-local.sh stop      # stop everything
```

---

## Deploy free

The repo ships a **Render Blueprint** (`render.yaml`: API, ML service, Postgres, Redis) and a Vercel config for the frontend. On first start the container waits for the database, applies all migrations, loads reference data and, if `SEED_DEMO=true`, seeds demo data. A background job refreshes the board hourly.

Step-by-step: [docs/DEPLOY_RENDER_VERCEL.md](docs/DEPLOY_RENDER_VERCEL.md).

Key settings on the API service:

| Variable | Purpose |
|---|---|
| `CORS_ORIGINS` | Frontend origin(s) allowed to call the API |
| `PUBLIC_APP_URL` | Public frontend URL |
| `WEBAUTHN_ORIGINS` | Origins allowed for passkeys |
| `JWT_SECRET` | Token signing secret |
| `SEED_DEMO` | `true` to seed demo data; `false` for a real launch |
| `DB_SSLMODE` | PostgreSQL SSL mode |

On Vercel set `VITE_API_URL` to the API address (see `frontend/.env.production.example`).

---

## Project layout

```
src/            C++ backend: controllers, services, middleware, realtime, graphql, jobs
migrations/     45 SQL migrations
frontend/       React + TypeScript app (pages per role and domain)
ml_service/     Flask delay-prediction service
scripts/        bootstrap, seed, integration tests, secret scan, local run
deploy/         production compose files
docs/           deployment, security and setup guides, screenshots
render.yaml     Render Blueprint
```

---

## Known limits

- Fares are indicative estimates, not live airline pricing.
- Weather comes from Open-Meteo; map tiles come from OpenStreetMap.
- Free-tier hosting sleeps when idle, so the first request after a pause is slow.
- Demo data is synthetic. No real passenger data is included.
- Payments are simulated; no real money moves.

---

## Roadmap

- Live airline fare and schedule feeds in place of indicative fares.
- Native mobile apps for passengers and ground staff.
- Real payment gateway integration for bookings and shop orders.
- Offline-friendly staff tools for poor-connectivity zones.
- More overseas hubs and localisation.

## Contributing

Issues and pull requests are welcome. Run `bash scripts/install-hooks.sh` once per clone to enable the secret-scan hook, and make sure `bash scripts/run-local.sh test` and `cd frontend && npx vitest run` pass before opening a PR.

## License

Released under the [MIT License](LICENSE). © 2026 helloAi0.

---

<div align="center">

Built by [@helloAi0](https://github.com/helloAi0) · **[Live demo](https://aero-base-india.vercel.app)**

</div>
