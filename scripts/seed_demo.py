#!/usr/bin/env python3
"""Seed a demo/investor environment with REAL rows: today's flights for DEL/BOM/BLR and one user per role.

  DB_PASSWORD=... DEMO_PASSWORD='choose-a-strong-one' python3 scripts/seed_demo.py

Re-run daily (or from cron) to roll the board forward to today; it is idempotent.
Never run this against a production database that holds real operations data.
"""
import hashlib, json, os, re, secrets, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datetime import date, datetime, timedelta

ITER = int(os.environ.get("PASSWORD_PBKDF2_ITERATIONS", "600000"))
HERE = os.path.dirname(os.path.abspath(__file__))
AIRPORTS = {"DEL": "Indira Gandhi Intl", "BOM": "Mumbai CSMIA", "BLR": "Kempegowda Intl"}

def hash_pw(pw):
    salt = secrets.token_bytes(16)
    return f"pbkdf2${ITER}${salt.hex()}${hashlib.pbkdf2_hmac('sha256', pw.encode(), salt, ITER, 32).hex()}"

def psql(sql, **v):
    if os.environ.get("SEED_VIA_DOCKER"):   # run psql inside the Postgres container (no client needed on the host)
        args = ["docker", "exec", "-i", os.environ["SEED_VIA_DOCKER"], "psql", "-U", "postgres", "-d", "aerobase", "-v", "ON_ERROR_STOP=1", "-tA", "-f", "-"]
        for k, val in v.items(): args += ["-v", f"{k}={val}"]
        r = subprocess.run(args, input=sql, text=True, capture_output=True)
        if r.returncode: sys.exit(r.stderr.strip())
        return r.stdout
    args = ["psql", "-h", os.environ.get("DB_HOST", "localhost"), "-p", os.environ.get("DB_PORT", "5432"),
            "-U", os.environ.get("DB_USER", "postgres"), "-d", os.environ.get("DB_NAME", "aerobase"), "-v", "ON_ERROR_STOP=1", "-tA", "-f", "-"]
    for k, val in v.items(): args += ["-v", f"{k}={val}"]
    r = subprocess.run(args, input=sql, text=True, capture_output=True, env=dict(os.environ, PGPASSWORD=os.environ.get("DB_PASSWORD", "postgres")))
    if r.returncode: sys.exit(r.stderr.strip())
    return r.stdout

STORES = {   # well-known concession brands operating in Indian airports (names/categories only; no financial figures)
    "DEL": [("Starbucks","F&B","T3","Post-security"),("McDonald's","F&B","T3","Food court"),("WHSmith","Books/News","T3","Departures"),("Titan","Retail","T3","Departures"),("Forest Essentials","Beauty","T3","Post-security"),("Crossword","Books/News","T1","Departures"),("Burger King","F&B","T1","Food court")],
    "BOM": [("Starbucks","F&B","T2","Post-security"),("Hamleys","Retail","T2","Departures"),("WHSmith","Books/News","T2","Departures"),("Lifestyle Duty Free","Duty Free","T2","International departures"),("Costa Coffee","F&B","T1","Food court")],
    "BLR": [("Starbucks","F&B","T1","Post-security"),("Burger King","F&B","T1","Food court"),("Crossword","Books/News","T1","Departures"),("Forest Essentials","Beauty","T2","Post-security"),("Duty Free","Duty Free","T2","International departures")],
}
def seed_stores(code):
    psql("DELETE FROM app_records WHERE collection='stores' AND created_by IS NULL AND tenant_id=(SELECT id FROM tenants WHERE airport_code=:'c');", c=code)
    for name, cat, term, loc in STORES.get(code, []):
        d = json.dumps({"name": name, "category": cat, "terminal": term, "location": loc, "status": "Open"})
        psql("INSERT INTO app_records (tenant_id, collection, data) SELECT id, 'stores', :'d'::jsonb FROM tenants WHERE airport_code=:'c';", c=code, d=d)

def generated_schedule(code, today):
    """A full realistic day of departures from the airport's real airline network; status follows the clock."""
    import random, reference_data as R
    rnd = random.Random(f"{code}-{today}"); now = datetime.now(); rows = []; used = set()
    ac = {a[0]: a for a in R.AIRCRAFT}; names = {a[0]: a[2] for a in R.AIRLINES}
    for air, term, dests, types in R.NETWORK[code]:
        intl = lambda d: R.airport(d)[4] != "IN"
        for d in dests:
            for k in range(1 if intl(d) else rnd.choice([1, 2, 3])):
                t = rnd.choice(types); minute = rnd.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
                dep = datetime.combine(today, datetime.min.time()) + timedelta(hours=rnd.randint(5, 23), minutes=minute)
                num = f"{air}-{rnd.randint(100, 999) if intl(d) else rnd.randint(200, 899)}"
                if num in used: continue
                used.add(num); arr = dep + timedelta(minutes=R.block_minutes(code, d, ac[t][5]))
                mins = (dep - now).total_seconds() / 60
                st = "Departed" if mins < -20 else "Boarding" if mins < 25 and mins >= -20 else "Scheduled"
                delay = rnd.choice([0, 0, 0, 0, 15, 20, 35, 50]) if st == "Scheduled" else 0
                if delay: st = "Delayed"
                issue = ("Late inbound aircraft" if delay <= 20 else "Air traffic congestion") if delay else ""
                gate = f"{rnd.choice('ABCD')}{rnd.randint(1, 12)}"
                pax = int(ac[t][2] * rnd.uniform(0.62, 0.97))
                rows.append((num, code, d, dep, arr, gate, st, names[air], air, t, term, pax, issue, delay))
    return rows

def swap(code, home):   # re-home the Delhi board onto another airport
    return home if code == "DEL" else ("DEL" if code == home else code)

def main():
    subprocess.run([sys.executable, os.path.join(HERE, "load_reference_data.py")], check=True)
    pw = os.environ.get("DEMO_PASSWORD") or secrets.token_urlsafe(12)
    if len(pw) < 10: sys.exit("DEMO_PASSWORD must be at least 10 characters")
    flights = json.load(open(os.path.join(HERE, "demo_flights.json")))
    today = date.today()
    for code, name in AIRPORTS.items():
        psql("INSERT INTO tenants (id, airport_name, airport_code, subscription_plan) SELECT gen_random_uuid(), :'n', :'c', 'STANDARD' WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE airport_code = :'c');", n=name, c=code)
        psql("DELETE FROM flights WHERE tenant_id = (SELECT id FROM tenants WHERE airport_code = :'c') AND airline_partner_id IS NULL;", c=code)
        rows = []
        for f in flights:
            o, d = (swap(f["from"], code), swap(f["to"], code)) if code != "DEL" else (f["from"], f["to"])
            if code != "DEL" and "DEL" not in (f["from"], f["to"]): continue
            dep = datetime.combine(today, datetime.strptime(f["dep"], "%H:%M").time())
            arr = datetime.combine(today, datetime.strptime(f["arr"], "%H:%M").time())
            if arr <= dep: arr += timedelta(days=1)
            m = re.search(r"(\d+)\s*min", f["issue"]); delay = int(m.group(1)) if m else (30 if f["status"] == "Delayed" else 0)
            rows.append((f["flight"], o, d, dep, arr, f["gate"], f["status"], f["airline"], f["code"], f["aircraft"], f["terminal"], f["pax"], f["issue"], delay))
        rows += generated_schedule(code, today)
        seed_stores(code)
        vals = ",".join("(gen_random_uuid(),(SELECT id FROM tenants WHERE airport_code='%s'),%s)" % (code, ",".join("'%s'" % str(x).replace("'", "''") if not isinstance(x, int) else str(x) for x in r)) for r in rows)
        psql("INSERT INTO flights (id,tenant_id,flight_number,origin,destination,departure_time,arrival_time,gate,status,airline,airline_code,aircraft,terminal,passengers,issue,delay_minutes) VALUES " + vals + " ON CONFLICT (tenant_id, flight_number, departure_time) DO NOTHING;")
        print(f"{code}: {len(rows)} flights for {today}")
    users = [("Arjun Sharma", "admin@{a}.aerobase.in", "AIRPORT_ADMIN", ""), ("Ravi Kumar", "staff@{a}.aerobase.in", "GROUND_STAFF", ""),
             ("Neha Singh", "security@{a}.aerobase.in", "SECURITY_OFFICER", ""), ("Vistara Ops", "ops@vistara.{a}.aerobase.in", "AIRLINE_OPS", "UK"),
             ("Capt. Sharma", "captain@airindia.{a}.aerobase.in", "PILOT", "AI"), ("Starbucks", "shop@{a}.aerobase.in", "RETAILER", "starbucks"), ("Demo Passenger", "passenger@{a}.aerobase.in", "PASSENGER", ""), ("Platform Owner", "owner@aerobase.in", "SUPER_ADMIN", "")]
    ph = hash_pw(pw)
    for a in AIRPORTS:
        for n, e, role, org in users:
            psql("INSERT INTO users (id,tenant_id,full_name,email,password_hash,role,org_code) SELECT gen_random_uuid(),id,:'n',:'e',:'h',:'r',NULLIF(:'o','') FROM tenants WHERE airport_code=:'a' "
                 "ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, org_code=EXCLUDED.org_code;", n=n, e=e.format(a=a.lower()), h=ph, r=role, o=org, a=a)
    print("\nDemo users (same password for all):", pw)
    print("  e.g. admin@del.aerobase.in, staff@bom.aerobase.in, ops@vistara.del.aerobase.in, shop@blr.aerobase.in")

if __name__ == "__main__": main()
