CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- MAANG Logic: Money should ideally be integers (cents) to avoid floating point errors, 
    -- but NUMERIC(12,2) is safe in PostgreSQL for standard currencies.
    base_plan_fee NUMERIC(12,2) DEFAULT 0.00,
    overage_fee NUMERIC(12,2) DEFAULT 0.00,
    subtotal NUMERIC(12,2) NOT NULL,
    tax NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, FINALIZED, PAID, OVERDUE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE
);

-- Protect against accidental modifications of finalized invoices
CREATE OR REPLACE FUNCTION prevent_finalized_invoice_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('FINALIZED', 'PAID') AND NEW.status = OLD.status THEN
        RAISE EXCEPTION 'Immutable Record: Cannot edit a finalized invoice.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_immutable_invoices ON invoices;
CREATE TRIGGER trigger_immutable_invoices
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION prevent_finalized_invoice_update();
