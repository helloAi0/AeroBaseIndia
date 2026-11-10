CREATE TABLE IF NOT EXISTS tenant_branding (
    id UUID PRIMARY KEY,
    tenant_id UUID UNIQUE REFERENCES tenants(id),
    company_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#0052cc',
    secondary_color VARCHAR(20) DEFAULT '#ffffff',
    support_email VARCHAR(255),
    custom_domain VARCHAR(255),
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    language VARCHAR(50) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);