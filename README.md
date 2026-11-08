# AeroBase India ✈

> Multi-tenant Airport Management SaaS Platform

## Tech Stack
- **Backend**: C++20 + Drogon Framework
- **Database**: PostgreSQL + Redis
- **ML Service**: Python Flask
- **Frontend**: React + TypeScript + Tailwind + Recharts
- **Payments**: Razorpay + Stripe
- **Deploy**: Docker + Kubernetes

## Quick Start
```bash
# 1. Start services
sudo service postgresql start
sudo service redis-server start

# 2. Start backend
cd build && ./AeroBaseIndia

# 3. Start ML service
cd ml_service && python3 app.py

# 4. Start frontend
cd frontend && npm run dev
```

## Portals
| Portal | URL | Users |
|--------|-----|-------|
| Admin Dashboard | http://localhost:3000 | Airport operators |
| API Docs | http://localhost:8080/docs | Developers |
| Metrics | http://localhost:8080/metrics | DevOps |
| GraphQL | http://localhost:8080/graphql | Partners |

## Phases Completed: 47/47 ✅
