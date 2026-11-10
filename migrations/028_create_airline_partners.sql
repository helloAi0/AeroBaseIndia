CREATE TABLE IF NOT EXISTS airline_partners (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    airline_code VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'AI', '6E'
    airline_name VARCHAR(255) NOT NULL,
    webhook_url TEXT, -- Where we send delay alerts to them
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);