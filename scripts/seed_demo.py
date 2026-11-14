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
AIRPORTS = {"DEL": "Indira Gandhi Intl", "BOM": "Mumbai CSMIA", "BLR": "Kempegowda Intl", "HYD": "Rajiv Gandhi Intl", "CCU": "Netaji Subhas Chandra Bose Intl",
            "MAA": "Chennai Intl", "COK": "Cochin Intl", "GOI": "Manohar Intl (Mopa)", "AMD": "Sardar Vallabhbhai Patel Intl", "PNQ": "Pune Intl",
            "JAI": "Jaipur Intl", "GAU": "Lokpriya Gopinath Bordoloi Intl", "SXR": "Sheikh ul-Alam Intl (Srinagar)", "LKO": "Chaudhary Charan Singh Intl", "TRV": "Trivandrum Intl",
            "DXB": "Dubai Intl", "DOH": "Hamad Intl (Doha)", "LHR": "London Heathrow", "SIN": "Singapore Changi", "AUH": "Zayed Intl (Abu Dhabi)"}

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

STORES = {   # Brands confirmed from public sources (airport operators, Avolta, Croma, trade press); names/categories only, no financial figures.
    "DEL": [("Delhi Duty Free","Duty Free","T3","Departures & arrivals"),("Shoppers Stop","Retail","T3",""),("Croma","Retail","T3","Electronics")],
    "BOM": [("Costa Coffee","F&B","T2",""),("Street Foods by Punjab Grill","F&B","T2",""),("McDonald's","F&B","T2",""),("The Irish House","F&B","T2",""),("Caffe Ritazza","F&B","T2",""),("The Beer Cafe","F&B","T2","Departures"),
            ("Starbucks","F&B","T1","Arrivals"),("Nourish","F&B","T1",""),("Shawarma Shack","F&B","T1",""),("Madras Coffee House","F&B","T1",""),("Naturals","F&B","T1",""),("Coffee Bean & Tea Leaf","F&B","T1","T1C"),("Cafe Coffee Day","F&B","T1","T1C"),("Black Dog","F&B","T1","T1B"),
            ("Haldiram's","F&B","",""),("Theobroma","F&B","",""),("Subway","F&B","",""),("KFC","F&B","","")],
    "BLR": [("Avolta Duty Free (Departures)","Duty Free","T2",""),("Avolta Duty Free (Arrivals)","Duty Free","T2",""),("Johnny Rockets","F&B","T2",""),("Wolfgang Puck","F&B","T2",""),("Giraffe","F&B","T2",""),("Carluccio's","F&B","T2",""),("Madeleine's","F&B","T2",""),("P.F. Chang's","F&B","T2",""),
            ("Avolta Duty Free","Duty Free","T1","")],
}
def seed_stores(code):
    psql("DELETE FROM app_records WHERE collection='stores' AND created_by IS NULL AND tenant_id=(SELECT id FROM tenants WHERE airport_code=:'c');", c=code)
    for name, cat, term, loc in STORES.get(code, []):
        d = json.dumps({k: v for k, v in {"name": name, "category": cat, "terminal": term, "location": loc, "status": "Open"}.items() if v})
        psql("INSERT INTO app_records (tenant_id, collection, data) SELECT id, 'stores', :'d'::jsonb FROM tenants WHERE airport_code=:'c';", c=code, d=d)

ROSTER = [("Ravi Kumar", "Passenger assistance agent", "Morning", True), ("Meena Nair", "Passenger assistance agent", "Afternoon", True), ("Imran Khan", "Terminal duty officer", "Morning", True),
          ("Kavita Singh", "Check-in agent", "Afternoon", False), ("Suresh Patil", "Ramp agent", "Night", False), ("Anita Das", "Passenger assistance agent", "Night", True)]
def seed_staff(code, terminals):
    """A small sample roster so Staff Management and the Accessibility team are not empty. Names are placeholders; replace via Staff Management."""
    psql("DELETE FROM app_records WHERE collection='staff' AND created_by IS NULL AND tenant_id=(SELECT id FROM tenants WHERE airport_code=:'c');", c=code)
    for i, (name, role, shift, assist) in enumerate(ROSTER):
        d = json.dumps({"ref": f"STF-{code}-{i+1:02d}", "name": name, "role": role, "shift": shift, "terminal": terminals[i % len(terminals)], "status": "On duty" if shift != "Night" else "Off duty", "assist": "Yes" if assist else "No", "phone": ""})
        psql("INSERT INTO app_records (tenant_id, collection, data) SELECT id, 'staff', :'d'::jsonb FROM tenants WHERE airport_code=:'c';", c=code, d=d)

OUTLETS = [  # airport-run sample outlets (no login owner): (name, category, hours, [(product, category, price, stock)])
    ("Chai & Co", "F&B", "04:00 – 23:59", [("Masala chai", "Drinks", 40, 80), ("Filter coffee", "Drinks", 60, 60), ("Veg sandwich", "Snacks", 120, 30), ("Samosa (2 pcs)", "Snacks", 70, 40), ("Cold coffee", "Drinks", 110, 25)]),
    ("Terminal Bites", "F&B", "05:00 – 23:00", [("Paneer wrap", "Meals", 220, 20), ("Chicken biryani", "Meals", 340, 15), ("Veg thali", "Meals", 280, 18), ("Fresh lime soda", "Drinks", 90, 40)]),
    ("Sky Bookstore", "Books/News", "06:00 – 22:00", [("Bestseller paperback", "Books", 399, 25), ("Travel magazine", "Magazines", 250, 20), ("Neck pillow", "Travel", 650, 12), ("Earphones", "Travel", 499, 14)]),
    ("Wellness Pharmacy", "Services", "24 hours", [("Paracetamol strip", "Health", 30, 60), ("Motion-sickness tablets", "Health", 55, 30), ("Hand sanitiser", "Health", 70, 50), ("Face mask (5)", "Health", 60, 40)]),
]
def seed_outlets(code, terminals):
    """Airport-run sample outlets with menus so passengers can place real orders (stock, totals and delivery are enforced server-side)."""
    psql("DELETE FROM app_records WHERE created_by IS NULL AND tenant_id=(SELECT id FROM tenants WHERE airport_code=:'c') AND (collection IN ('products','orders') OR (collection='stores' AND data->>'name' = ANY(string_to_array(:'n', '|'))));", c=code, n="|".join(o[0] for o in OUTLETS))
    for i, (name, cat, hours, prods) in enumerate(OUTLETS):
        t = terminals[i % len(terminals)]
        d = json.dumps({"name": name, "category": cat, "terminal": t, "location": "Post-security", "hours": hours, "status": "Open", "deliver": "Yes", "contact": ""})
        sid = psql("INSERT INTO app_records (tenant_id, collection, data) SELECT id, 'stores', :'d'::jsonb FROM tenants WHERE airport_code=:'c' RETURNING id;", c=code, d=d)
        for pn, pc, price, stock in prods:
            pd = json.dumps({"name": pn, "category": pc, "price": price, "stock": stock, "available": "Yes", "shop": name})
            psql("INSERT INTO app_records (tenant_id, collection, data) SELECT id, 'products', :'d'::jsonb FROM tenants WHERE airport_code=:'c';", c=code, d=pd)

def seed_crew_and_dispatch(code):
    """Crew reference IDs (one claimed by the demo captain, one unclaimed to try pilot sign-up) and sample security instructions."""
    T = "(SELECT id FROM tenants WHERE airport_code=:'c')"
    psql(f"DELETE FROM app_records WHERE created_by IS NULL AND tenant_id={T} AND collection IN ('crew','dispatch');", c=code)
    for ref, name, lic, air, rank, claim in ((f"AI-FD-{code}001", "Capt. Sharma", "ATPL-IN-4471", "AI", "Captain", f"captain@airindia.{code.lower()}.aerobase.in"), (f"6E-FD-{code}002", "Demo Pilot", "ATPL-DEMO-1002", "6E", "First Officer", "")):
        psql(f"""INSERT INTO app_records (tenant_id, collection, data) SELECT {T}, 'crew', jsonb_build_object('refId', :'ref', 'name', :'name', 'license', :'lic', 'airline', :'air', 'rank', :'rank', 'base', :'c',
              'aircraft', COALESCE((SELECT aircraft FROM flights WHERE tenant_id={T} AND airline_code=:'air' ORDER BY departure_time LIMIT 1), ''),
              'flights', COALESCE((SELECT string_agg(flight_number, ', ') FROM (SELECT flight_number FROM flights WHERE tenant_id={T} AND airline_code=:'air' ORDER BY departure_time LIMIT 4) x), ''),
              'status', CASE WHEN :'claim' = '' THEN 'Unclaimed' ELSE 'Active' END)
              || CASE WHEN :'claim' = '' THEN '{{}}'::jsonb ELSE (SELECT jsonb_build_object('claimedBy', id::text, 'claimedName', full_name) FROM users WHERE email = :'claim') END;""", c=code, ref=ref, name=name, lic=lic, air=air, rank=rank, claim=claim)
    for to_email, text, zone, pr, st in (("rohan.security", "Unattended bag reported near the gate area. Check and clear it.", "Gates", "High", "New"), ("priya.security", "Support the departure queue at security screening; passengers are backing up.", "Security", "Medium", "Acknowledged"), ("imran.security", "Escort the VIP delegation from arrivals to the kerb.", "Arrivals", "Medium", "New")):
        psql(f"""INSERT INTO app_records (tenant_id, collection, data) SELECT {T}, 'dispatch', jsonb_build_object('toId', u.id::text, 'toName', u.full_name, 'to', 'SEC-' || upper(substr(replace(u.id::text,'-',''),1,6)), 'text', :'t', 'zone', :'z', 'priority', :'p', 'status', :'st', 'from', 'Head of Security')
              FROM users u WHERE u.email = :'e';""", c=code, e=f"{to_email}@{code.lower()}.aerobase.in", t=text, z=zone, p=pr, st=st)

BAG_NAMES = ["A. Sharma", "R. Iyer", "M. Khan", "S. Das", "P. Nair", "K. Singh", "N. Gupta", "T. Joshi", "L. Fernandes", "V. Reddy"]
def seed_baggage(code, rows):
    """Sample bags for the next departures so Baggage Handling is not empty. Status follows how close the flight is to departure."""
    import random
    rnd = random.Random(f"bags-{code}"); now = datetime.now()
    psql("DELETE FROM app_records WHERE collection='baggage' AND created_by IS NULL AND tenant_id=(SELECT id FROM tenants WHERE airport_code=:'c');", c=code)
    upcoming = sorted((r for r in rows if r[3] > now - timedelta(hours=1)), key=lambda r: r[3])[:8]
    n = 0
    for r in upcoming:
        mins = (r[3] - now).total_seconds() / 60
        status = "Delivered" if mins < -20 else "Loaded" if mins < 25 else "Screened" if mins < 90 else "Checked in"
        for _ in range(3):
            n += 1; st = "Delayed" if rnd.random() < 0.06 else status
            d = json.dumps({"ref": f"BAG-{code}-{n:03d}", "tag": f"{rnd.randint(10**9, 10**10-1)}", "flight": r[0], "passenger": rnd.choice(BAG_NAMES), "status": st, "belt": f"Gate {r[5]}", "weight_kg": rnd.randint(12, 28)})
            psql("INSERT INTO app_records (tenant_id, collection, data) SELECT id, 'baggage', :'d'::jsonb FROM tenants WHERE airport_code=:'c';", c=code, d=d)

def generated_schedule(code, today):
    """A full day of departures from the airport's real route network (OpenFlights); status follows the clock."""
    import random, reference_data as R
    rnd = random.Random(f"{code}-{today}"); now = datetime.now(); rows = []; used = set()
    ac = {a[0]: a for a in R.AIRCRAFT}; names = {a[0]: a[2] for a in R.AIRLINES}
    routes = R.ROUTES.get(code)
    hub = not routes   # overseas hubs: the real routes into the hub, flown in reverse, 2-3 times a day
    if hub: routes = [(src, air, types, n) for src, items in R.ROUTES.items() for dst, air, types, n in items if dst == code]
    for dst, air, types, on_route in routes:
        if dst not in {a[0] for a in R.AIRPORTS}: continue
        intl = R.airport(dst)[4] != R.airport(code)[4]; km = R.distance_km(code, dst)
        if not types: types = ["A320neo"] if km < 2500 else ["B787-8"] if km < 9000 else ["B777-300ER"]
        for k in range(rnd.choice([2, 2, 3]) if hub else 1 if intl or air not in R.LOW_COST else rnd.choice([1, 2, 2, 3])):
            t = rnd.choice(types); minute = rnd.choice(range(0, 60, 5))
            dep = datetime.combine(today, datetime.min.time()) + timedelta(hours=rnd.randint(5, 23), minutes=minute)
            num = f"{air}-{rnd.randint(100, 999) if intl else rnd.randint(200, 899)}"
            if num in used: continue
            used.add(num); arr = dep + timedelta(minutes=R.block_minutes(code, dst, ac[t][5]))
            mins = (dep - now).total_seconds() / 60
            st = "Departed" if mins < -20 else "Boarding" if mins < 25 else "Scheduled"
            delay = rnd.choice([0, 0, 0, 0, 15, 20, 35, 50]) if st == "Scheduled" else 0
            if delay: st = "Delayed"
            issue = ("Late inbound aircraft" if delay <= 20 else "Air traffic congestion") if delay else ""
            term = R.terminal(code, air, intl); gate = f"{rnd.choice('ABCD')}{rnd.randint(1, 12)}"
            rows.append((num, code, dst, dep, arr, gate, st, names.get(air, air), air, t, term, int(ac[t][2] * rnd.uniform(0.62, 0.97)), issue, delay))
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
        psql("DELETE FROM users WHERE email LIKE 'ops@vistara.%';")
        psql("DELETE FROM flights WHERE tenant_id = (SELECT id FROM tenants WHERE airport_code = :'c') AND airline_partner_id IS NULL;", c=code)
        rows = []
        for f in (flights if code in ("DEL", "BOM", "BLR") else []):
            o, d = (swap(f["from"], code), swap(f["to"], code)) if code != "DEL" else (f["from"], f["to"])
            if code != "DEL" and "DEL" not in (f["from"], f["to"]): continue
            dep = datetime.combine(today, datetime.strptime(f["dep"], "%H:%M").time())
            arr = datetime.combine(today, datetime.strptime(f["arr"], "%H:%M").time())
            if arr <= dep: arr += timedelta(days=1)
            m = re.search(r"(\d+)\s*min", f["issue"]); delay = int(m.group(1)) if m else (30 if f["status"] == "Delayed" else 0)
            rows.append((f["flight"], o, d, dep, arr, f["gate"], f["status"], f["airline"], f["code"], f["aircraft"], f["terminal"], f["pax"], f["issue"], delay))
        rows += generated_schedule(code, today)
        seed_stores(code)
        seed_outlets(code, sorted({r[10] for r in rows if r[10]}) or ["T1"])
        seed_baggage(code, rows)
        seed_staff(code, sorted({r[10] for r in rows if r[10]}) or ["T1"])
        vals = ",".join("(gen_random_uuid(),(SELECT id FROM tenants WHERE airport_code='%s'),%s)" % (code, ",".join("'%s'" % str(x).replace("'", "''") if not isinstance(x, int) else str(x) for x in r)) for r in rows)
        psql("INSERT INTO flights (id,tenant_id,flight_number,origin,destination,departure_time,arrival_time,gate,status,airline,airline_code,aircraft,terminal,passengers,issue,delay_minutes) VALUES " + vals + " ON CONFLICT (tenant_id, flight_number, departure_time) DO NOTHING;")
        print(f"{code}: {len(rows)} flights for {today}")
    users = [("Arjun Sharma", "admin@{a}.aerobase.in", "AIRPORT_ADMIN", ""), ("Ravi Kumar", "staff@{a}.aerobase.in", "GROUND_STAFF", ""),
             ("Neha Singh", "security@{a}.aerobase.in", "SECURITY_OFFICER", ""), ("IndiGo Ops", "ops@indigo.{a}.aerobase.in", "AIRLINE_OPS", "6E"),
             ("Capt. Sharma", "captain@airindia.{a}.aerobase.in", "PILOT", "AI"), ("Head of Security", "head.security@{a}.aerobase.in", "SECURITY_OFFICER", "HEAD"), ("Rohan Verma", "rohan.security@{a}.aerobase.in", "SECURITY_OFFICER", ""), ("Priya Nair", "priya.security@{a}.aerobase.in", "SECURITY_OFFICER", ""), ("Imran Sheikh", "imran.security@{a}.aerobase.in", "SECURITY_OFFICER", ""), ("Demo Shop Owner", "shop@{a}.aerobase.in", "RETAILER", ""), ("Demo Passenger", "passenger@{a}.aerobase.in", "PASSENGER", ""), ("Platform Owner", "owner@aerobase.in", "SUPER_ADMIN", "")]
    ph = hash_pw(pw)
    for a in AIRPORTS:
        vals = ",".join("(gen_random_uuid(),t.id,'%s','%s','%s','%s',%s)" % (n.replace("'", "''"), e.format(a=a.lower()), ph, role, "'%s'" % org if org else "NULL") for n, e, role, org in users if "{a}" in e or a == "DEL")
        psql("INSERT INTO users (id,tenant_id,full_name,email,password_hash,role,org_code) SELECT v.* FROM tenants t, LATERAL (VALUES " + vals + ") AS v(id,tid,n,e,h,r,o) WHERE t.airport_code=:'a' "
             "ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name, password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, org_code=EXCLUDED.org_code;", a=a)
    for a in AIRPORTS: seed_crew_and_dispatch(a)
    for a in AIRPORTS:   # one operations login per airline that flies at the airport: ops.<iata>@<airport>.aerobase.in
        psql("INSERT INTO users (id,tenant_id,full_name,email,password_hash,role,org_code) SELECT gen_random_uuid(), t.id, f.airline || ' Operations', 'ops.' || lower(f.airline_code) || '@' || lower(:'a') || '.aerobase.in', :'h', 'AIRLINE_OPS', f.airline_code "
             "FROM tenants t JOIN (SELECT DISTINCT ON (tenant_id, airline_code) tenant_id, airline, airline_code FROM flights WHERE airline_code IS NOT NULL ORDER BY tenant_id, airline_code, airline) f ON f.tenant_id = t.id WHERE t.airport_code=:'a' "
             "ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role, org_code=EXCLUDED.org_code;", a=a, h=ph)
    print("\nDemo users (same password for all):", pw)
    print("  e.g. admin@del.aerobase.in, staff@bom.aerobase.in, ops@indigo.del.aerobase.in, shop@blr.aerobase.in")

if __name__ == "__main__": main()
