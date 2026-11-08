CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_price NUMERIC(12,2) NOT NULL,
    max_airlines INT,
    max_users INT,
    api_rate_limit INT,
    premium_features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);