CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);