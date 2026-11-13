-- Real reference datasets: OurAirports (airports, runways) and OpenFlights (airlines, routes).
ALTER TABLE reference_airports ADD COLUMN IF NOT EXISTS elevation_ft INT;
ALTER TABLE reference_airports ADD COLUMN IF NOT EXISTS airport_type VARCHAR(20);
ALTER TABLE reference_airports ADD COLUMN IF NOT EXISTS runways INT;
ALTER TABLE reference_airports ADD COLUMN IF NOT EXISTS longest_runway_m INT;
ALTER TABLE reference_airports ALTER COLUMN name TYPE VARCHAR(160);
ALTER TABLE reference_airports ALTER COLUMN city TYPE VARCHAR(100);
ALTER TABLE reference_airlines ALTER COLUMN name TYPE VARCHAR(120);
CREATE TABLE IF NOT EXISTS reference_routes (
    origin CHAR(3) NOT NULL, destination CHAR(3) NOT NULL, airline VARCHAR(3) NOT NULL,
    aircraft_types TEXT NOT NULL DEFAULT '', airlines_on_route INT NOT NULL DEFAULT 1,
    PRIMARY KEY (origin, destination, airline)
);
CREATE INDEX IF NOT EXISTS idx_ref_routes_origin ON reference_routes (origin);
ALTER TABLE reference_airlines ALTER COLUMN country TYPE VARCHAR(60);
ALTER TABLE reference_airlines ALTER COLUMN icao TYPE VARCHAR(4);
ALTER TABLE reference_airports ALTER COLUMN icao TYPE VARCHAR(10);
