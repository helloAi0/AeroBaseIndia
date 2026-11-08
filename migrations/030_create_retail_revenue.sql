CREATE TABLE IF NOT EXISTS retail_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    store_id UUID NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    sale_amount NUMERIC(12,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- MAANG Logic: Database-level safety check. Sales cannot be negative!
    CONSTRAINT check_positive_sale CHECK (sale_amount >= 0)
);

CREATE INDEX idx_retail_tenant_date ON retail_revenue(tenant_id, recorded_at);