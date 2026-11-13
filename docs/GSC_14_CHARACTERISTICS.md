# AeroBase India — the 14 General System Characteristics (Function Point Analysis)

Each characteristic is rated 0–5 (degree of influence) with the concrete evidence in this repository.
Total Degree of Influence (TDI) = sum of the 14 ratings. **Value Adjustment Factor VAF = 0.65 + 0.01 × TDI.**

| # | Characteristic | Rating | Evidence in the project |
|---|---|:-:|---|
| 1 | Data Communications | 5 | REST API (Drogon), WebSocket live feed, GraphQL endpoint, partner API with API-key auth (`/api/partner/*`), SMS / WhatsApp / Telegram / email notification channels, CORS for separately hosted frontends. |
| 2 | Distributed Data Processing | 3 | Separate processes/containers: C++ API, Flask ML service, PostgreSQL, Redis; frontend is a separately hosted SPA. Processing is split between API and ML service. |
| 3 | Performance | 4 | Per-thread DB connections, Redis flight cache and rate limiting, 15-second board refresh, indexed queries (`idx_flights_tenant_dep`, `idx_records_lookup`), k6/wrk load tests in `load-tests/`, Prometheus metrics at `/metrics`. |
| 4 | Heavily Used Configuration | 3 | Runs on shared hosting with config from environment only (`DB_*`, `JWT_SECRET`, `REDIS_*`, `WEBAUTHN_ORIGINS`); startup checks refuse weak secrets in production. |
| 5 | Transaction Rate | 4 | Every logged-in user polls the live board; partner airlines push flight syncs; bids, check-ins and incidents are written continuously. Sized with `load-tests/` and an HPA in `deploy/k8s/hpa.yaml`. |
| 6 | On-Line Data Entry | 5 | Nearly all data is entered interactively: flights (Scheduler), incidents, maintenance, baggage, cargo, check-in, staff, feedback, bids, emergencies, passkey check-in. Schema-driven forms with server-side validation. |
| 7 | End-User Efficiency | 4 | Role-based dashboards and navigation, auto-routing by role, search/filter on every list, multilingual announcements (EN/HI/GU/PA/TA), responsive/mobile layouts, passkey (fingerprint/face) check-in. |
| 8 | On-Line Update | 4 | Records and flights are updated in place with validation, transactions and an audit trail (`audit_logs`); gate changes are applied live (PATCH) and visible to all users on the next refresh. |
| 9 | Complex Processing | 4 | Delay/disruption engine, what-if simulator, gate optimiser with conflict resolution, carbon accounting from fuel burn, turnaround planner, great-circle route/block-time calculation, PBKDF2 + JWT security, WebAuthn signature verification (ES256/RS256). |
| 10 | Reusability | 4 | One generic tenant-scoped record store (`app_records`) with a per-collection policy table drives 15+ pages; shared `RecordsPage`, `useBoard`, `useCollection`; reference data tables shared by all tenants. |
| 11 | Installation Ease | 4 | `scripts/run-local.sh` (one command), Docker Compose (dev + prod), `scripts/migrate.sh` (idempotent), `scripts/init-prod-env.sh` (generates secrets), `scripts/seed_demo.py`. |
| 12 | Operational Ease | 4 | `/health` (DB/Redis/ML status), Prometheus + Grafana configs, audit log API, `scripts/backup.sh`, structured error responses, Docker healthchecks. |
| 13 | Multiple Sites | 5 | Multi-tenant by design: every airport (DEL, BOM, BLR, …) is a tenant with isolated data, its own users, plan and billing; a SUPER_ADMIN onboards new airports (`/api/tenants`). Tenant isolation is covered by integration tests. |
| 14 | Facilitate Change | 4 | Versioned SQL migrations (001–043), config-driven record policies and form schemas, typed frontend (TypeScript), 52 unit tests + 39 integration tests to catch regressions (`make test`). |

**TDI = 5+3+4+3+4+5+4+4+4+4+4+4+5+4 = 57**
**VAF = 0.65 + 0.01 × 57 = 1.22**

Adjusted Function Points = Unadjusted Function Points × 1.22. These ratings are an engineering self-assessment; adjust any
line if your reviewer scores it differently — the evidence column shows where to look.
