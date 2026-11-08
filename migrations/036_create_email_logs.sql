CREATE TABLE IF NOT EXISTS email_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  VARCHAR(100),
    recipient  VARCHAR(255) NOT NULL,
    subject    VARCHAR(500),
    body       TEXT,
    type       VARCHAR(50),
    sent_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type   ON email_logs(type);
