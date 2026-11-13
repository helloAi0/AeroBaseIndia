#!/usr/bin/env python3
"""Load the airport / airline / aircraft reference tables (idempotent). Usage: DB_* env as for seed_demo.py."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reference_data as R

def q(x): return "'" + str(x).replace("'", "''") + "'" if isinstance(x, str) else ("TRUE" if x is True else "FALSE" if x is False else str(x))
def run(sql):
    if os.environ.get("SEED_VIA_DOCKER"):
        r = subprocess.run(["docker", "exec", "-i", os.environ["SEED_VIA_DOCKER"], "psql", "-U", "postgres", "-d", "aerobase", "-v", "ON_ERROR_STOP=1", "-q", "-f", "-"], input=sql, text=True, capture_output=True)
        if r.returncode: sys.exit(r.stderr.strip())
        return
    r = subprocess.run(["psql", "-h", os.environ.get("DB_HOST", "localhost"), "-p", os.environ.get("DB_PORT", "5432"), "-U", os.environ.get("DB_USER", "postgres"),
                        "-d", os.environ.get("DB_NAME", "aerobase"), "-v", "ON_ERROR_STOP=1", "-q", "-f", "-"], input=sql, text=True, capture_output=True,
                       env=dict(os.environ, PGPASSWORD=os.environ.get("DB_PASSWORD", "postgres")))
    if r.returncode: sys.exit(r.stderr.strip())

def main():
    sql = []
    for a in R.AIRPORTS: sql.append("INSERT INTO reference_airports VALUES (%s) ON CONFLICT (iata) DO UPDATE SET icao=EXCLUDED.icao,name=EXCLUDED.name,city=EXCLUDED.city,country=EXCLUDED.country,lat=EXCLUDED.lat,lon=EXCLUDED.lon;" % ",".join(map(q, a)))
    for a in R.AIRLINES: sql.append("INSERT INTO reference_airlines VALUES (%s) ON CONFLICT (iata) DO UPDATE SET icao=EXCLUDED.icao,name=EXCLUDED.name,country=EXCLUDED.country,active=EXCLUDED.active;" % ",".join(map(q, a)))
    for a in R.AIRCRAFT: sql.append("INSERT INTO reference_aircraft VALUES (%s) ON CONFLICT (type_code) DO UPDATE SET name=EXCLUDED.name,seats=EXCLUDED.seats,fuel_kg_per_hour=EXCLUDED.fuel_kg_per_hour,range_km=EXCLUDED.range_km,cruise_kmh=EXCLUDED.cruise_kmh;" % ",".join(map(q, a)))
    run("\n".join(sql)); print(f"Reference data: {len(R.AIRPORTS)} airports, {len(R.AIRLINES)} airlines, {len(R.AIRCRAFT)} aircraft types")

if __name__ == "__main__": main()
