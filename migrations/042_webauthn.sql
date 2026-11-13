-- Real passkey (WebAuthn) credentials for biometric check-in: the device's fingerprint/face/PIN stays on the device;
-- the server stores only the public key.
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    cose_key      TEXT NOT NULL,
    sign_count    BIGINT NOT NULL DEFAULT 0,
    label         VARCHAR(60) NOT NULL DEFAULT 'This device',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials (user_id);
CREATE TABLE IF NOT EXISTS webauthn_challenges (
    challenge  TEXT PRIMARY KEY,
    user_id    UUID NOT NULL,
    purpose    VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
