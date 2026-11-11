-- Partner (airline) API keys + the columns the B2B flight sync needs. Idempotent.
CREATE TABLE IF NOT EXISTS partner_api_keys (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id   VARCHAR(64)  NOT NULL,
    tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
    key_hash     VARCHAR(128) NOT NULL UNIQUE,
    label        VARCHAR(100),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_partner_keys_partner ON partner_api_keys (partner_id) WHERE is_active;

ALTER TABLE flights ADD COLUMN IF NOT EXISTS airline_partner_id VARCHAR(64);
ALTER TABLE flights ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_flights_tenant_number_departure ON flights (tenant_id, flight_number, departure_time);
