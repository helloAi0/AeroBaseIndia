-- Global reference data (not tenant-specific): airports, airlines, aircraft types. Loaded by scripts/load_reference_data.py.
CREATE TABLE IF NOT EXISTS reference_airports (iata CHAR(3) PRIMARY KEY, icao CHAR(4) NOT NULL, name VARCHAR(100) NOT NULL, city VARCHAR(60) NOT NULL, country CHAR(2) NOT NULL, lat DOUBLE PRECISION NOT NULL, lon DOUBLE PRECISION NOT NULL);
CREATE TABLE IF NOT EXISTS reference_airlines  (iata VARCHAR(3) PRIMARY KEY, icao CHAR(3) NOT NULL, name VARCHAR(80) NOT NULL, country CHAR(2) NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE);
CREATE TABLE IF NOT EXISTS reference_aircraft  (type_code VARCHAR(12) PRIMARY KEY, name VARCHAR(60) NOT NULL, seats INT NOT NULL, fuel_kg_per_hour INT NOT NULL, range_km INT NOT NULL, cruise_kmh INT NOT NULL);
