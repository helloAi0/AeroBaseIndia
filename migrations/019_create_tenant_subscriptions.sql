CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);