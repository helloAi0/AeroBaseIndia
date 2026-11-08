CREATE TABLE passenger_bookings (
    id UUID PRIMARY KEY,
    passenger_id UUID REFERENCES passenger_accounts(id),
    flight_id UUID REFERENCES flights(id),
    seat_number VARCHAR(10),
    booking_reference VARCHAR(50),
    check_in_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);