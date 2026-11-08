CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    severity VARCHAR(20),
    category VARCHAR(100),
    description TEXT,
    reported_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);