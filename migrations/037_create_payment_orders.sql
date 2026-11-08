
CREATE TABLE IF NOT EXISTS payment_orders (
    id           VARCHAR(50)  PRIMARY KEY,
    tenant_id    VARCHAR(100) NOT NULL,
    invoice_id   VARCHAR(100),
    amount       DECIMAL(12,2) NOT NULL,
    currency     VARCHAR(10)  DEFAULT 'INR',
    status       VARCHAR(30)  DEFAULT 'CREATED',
    gateway      VARCHAR(30),
    gateway_ref  VARCHAR(200),
    checkout_url TEXT,
    paid_at      TIMESTAMP,
    created_at   TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_tenant ON payment_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_orders(status);
