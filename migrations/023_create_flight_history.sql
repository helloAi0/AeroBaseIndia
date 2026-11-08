CREATE TABLE flight_history (
    id UUID PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    flight_id UUID,
    airline VARCHAR(100),
    origin VARCHAR(10),
    destination VARCHAR(10),
    scheduled_departure TIMESTAMP,
    actual_departure TIMESTAMP,
    weather_score INTEGER,
    congestion_score INTEGER,
    delay_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);