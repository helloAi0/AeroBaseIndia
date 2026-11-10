CREATE TABLE IF NOT EXISTS revenue_metrics (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    metric_type VARCHAR(50),
    source_id UUID,
    amount NUMERIC(12,2),
    currency VARCHAR(10) DEFAULT 'INR',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);