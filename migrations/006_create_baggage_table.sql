CREATE TABLE baggage (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES passengers(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    tag_number VARCHAR(50) UNIQUE NOT NULL,
    weight NUMERIC(6,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Checked-In',
    current_location VARCHAR(100) DEFAULT 'Check-In Counter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);