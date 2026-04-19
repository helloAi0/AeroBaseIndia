CREATE TABLE gates (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    terminal VARCHAR(20) NOT NULL,
    gate_code VARCHAR(20) NOT NULL,
    status VARCHAR(30) DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, gate_code)
);