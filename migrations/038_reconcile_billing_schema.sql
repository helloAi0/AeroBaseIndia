-- Reconciles the overlapping billing/audit migrations (008-011, 017-021, 031-034 define the same tables
-- differently, and "first definition wins"). Additive and idempotent: adds every column the application's
-- SQL expects, without dropping anything.

-- audit_logs (AuditService / AuditRepository / ComplianceExportService)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
ALTER TABLE audit_logs ALTER COLUMN entity_id DROP NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN entity_type DROP NOT NULL;

-- invoices (BillingController, AdminRevenueController, BillingRepository)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_period_start DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_period_end DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_plan_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS overage_fee NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE invoices ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- tenant_subscriptions (SubscriptionGuard, AdminRevenueController, BillingRepository)
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(50);
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP;
ALTER TABLE tenant_subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE tenant_subscriptions ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- billing_invoices (RevenueAggregationService, GateProfitabilityService)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    gate_id UUID,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant ON billing_invoices(tenant_id, created_at);
