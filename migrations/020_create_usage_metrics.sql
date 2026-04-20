CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);