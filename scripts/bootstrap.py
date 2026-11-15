#!/usr/bin/env python3
"""Prepare the database for a hosted deployment (Render, Neon, any Postgres). Safe to run on every start.

  1. waits for Postgres, 2. applies every migration (idempotent), 3. loads the airport/airline/route
  reference data once, 4. with SEED_DEMO=true, creates today's flights and demo logins when a new day has started
  (existing flights, bookings and orders are never wiped by a restart).

Environment: DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD [DB_SSLMODE] [SEED_DEMO] [DEMO_PASSWORD]
Usage:  bootstrap.py            # migrations + reference data, then the demo seed if enabled
        bootstrap.py --daily    # only the demo seed (used by the hourly loop)
"""
import glob, os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
E = os.environ
def psql(args, sql=None):
    env = dict(E, PGPASSWORD=E.get("DB_PASSWORD", ""), PGSSLMODE=E.get("DB_SSLMODE", "prefer"))
    return subprocess.run(["psql", "-h", E.get("DB_HOST", "localhost"), "-p", E.get("DB_PORT", "5432"), "-U", E.get("DB_USER", "postgres"), "-d", E.get("DB_NAME", "aerobase"), "-v", "ON_ERROR_STOP=1", "-q", *args],
                          input=sql, text=True, capture_output=True, env=env)

def wait_for_db(seconds=120):
    end = time.time() + seconds
    while time.time() < end:
        if psql(["-tA", "-c", "SELECT 1"]).returncode == 0: return
        time.sleep(3)
    sys.exit("bootstrap: the database did not become reachable")

def migrate():
    mig = os.path.join(ROOT, "migrations")
    if not os.path.isdir(mig): mig = os.path.join(HERE, "..", "migrations")
    files = sorted(glob.glob(os.path.join(mig, "*.sql")))
    for f in files:
        r = psql(["-f", f])
        if r.returncode: sys.exit(f"bootstrap: migration {os.path.basename(f)} failed: {r.stderr.strip()[:400]}")
    print(f"bootstrap: {len(files)} migrations applied")

def reference_loaded():
    r = psql(["-tA", "-c", "SELECT count(*) FROM reference_airports"]); return r.returncode == 0 and int((r.stdout or "0").strip() or 0) > 0

def seed(first):
    if E.get("SEED_DEMO", "").lower() != "true": return
    pw = E.get("DEMO_PASSWORD", "")
    if len(pw) < 10: print("bootstrap: SEED_DEMO needs DEMO_PASSWORD (10+ characters); skipping the demo seed"); return
    r = subprocess.run([sys.executable, os.path.join(HERE, "seed_demo.py")], env=dict(E, SEED_KEEP_TODAY="1"), capture_output=True, text=True)
    print("bootstrap: demo seed", "ok" if r.returncode == 0 else "FAILED: " + (r.stderr or r.stdout)[-400:])

def main():
    wait_for_db()
    if "--daily" in sys.argv: return seed(False)
    migrate()
    if not reference_loaded():
        r = subprocess.run([sys.executable, os.path.join(HERE, "load_reference_data.py")], capture_output=True, text=True)
        print("bootstrap: reference data", "loaded" if r.returncode == 0 else "FAILED: " + (r.stderr or r.stdout)[-400:])
    if "--no-seed" not in sys.argv: seed(True)

if __name__ == "__main__": main()
