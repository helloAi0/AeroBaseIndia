CREATE TABLE payments (
    id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id),
    provider VARCHAR(50),
    provider_reference VARCHAR(255),
    amount NUMERIC(12,2),
    status VARCHAR(50),
    paid_at TIMESTAMP
);