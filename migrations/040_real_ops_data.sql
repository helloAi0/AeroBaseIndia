-- Real operational data: richer flights, per-user organisation, and a tenant-scoped records store. Idempotent.
INSERT INTO roles(id,name,description) VALUES
 (gen_random_uuid(),'AIRLINE_OPS','Airline operations (scoped to one airline)'),
 (gen_random_uuid(),'PILOT','Flight crew (scoped to one airline)'),
 (gen_random_uuid(),'RETAILER','Concession / shop owner')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS org_code VARCHAR(64);   -- airline code (AI, 6E…) or shop id

ALTER TABLE flights ADD COLUMN IF NOT EXISTS airline       VARCHAR(100);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS airline_code  VARCHAR(8);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS aircraft      VARCHAR(30);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS terminal      VARCHAR(10);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS passengers    INTEGER DEFAULT 0;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS issue         TEXT;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS delay_minutes INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_flights_tenant_dep ON flights (tenant_id, departure_time);

-- Generic, tenant-scoped, validated JSON documents (incidents, requests, bids, lost & found, …).
CREATE TABLE IF NOT EXISTS app_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    collection  VARCHAR(40) NOT NULL,
    data        JSONB NOT NULL,
    created_by  UUID,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_records_lookup ON app_records (tenant_id, collection, created_at DESC);
INSERT INTO tenants (id, airport_name, airport_code, subscription_plan)
SELECT gen_random_uuid(), 'Kempegowda Intl', 'BLR', 'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE airport_code = 'BLR');
