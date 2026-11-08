CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(50) NOT NULL, -- e.g., 'STRIPE', 'BANK_TRANSFER', 'RAZORPAY'
    transaction_ref VARCHAR(255) NOT NULL,
    
    -- MAANG Logic: Absolute protection against double-logging a payment
    CONSTRAINT unique_transaction_ref UNIQUE (transaction_ref)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);