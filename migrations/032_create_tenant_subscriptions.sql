CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50),
    started_at TIMESTAMP,
    expires_at TIMESTAMP
);