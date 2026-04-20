CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    monthly_price NUMERIC(12,2) NOT NULL,
    max_flights_per_month INTEGER,
    max_staff_users INTEGER,
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);