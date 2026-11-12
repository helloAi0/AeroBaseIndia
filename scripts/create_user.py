#!/usr/bin/env python3
"""Create or update an AeroBase user with a PBKDF2 password hash.

Usage: DB_PASSWORD=... scripts/create_user.py --email a@b.com --name "A B" \
         --role AIRPORT_ADMIN --airport DEL [--password ...]
Password is prompted for if not given. Uses psql with the DB_* env vars.
"""
import argparse, getpass, hashlib, os, secrets, subprocess, sys

ROLES = ["SUPER_ADMIN", "AIRPORT_ADMIN", "GROUND_STAFF", "SECURITY_OFFICER", "AIRLINE_OPS", "PILOT", "RETAILER", "PASSENGER"]
ITER = int(os.environ.get("PASSWORD_PBKDF2_ITERATIONS", "600000"))


def hash_pw(pw: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, ITER, 32)
    return f"pbkdf2${ITER}${salt.hex()}${dk.hex()}"


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--email", required=True)
    a.add_argument("--name", required=True)
    a.add_argument("--role", required=True, choices=ROLES)
    a.add_argument("--org", default="", help="airline code (AI, 6E…) or shop id for AIRLINE_OPS/PILOT/RETAILER")
    a.add_argument("--airport", required=True, help="airport_code of an existing tenant, e.g. DEL")
    a.add_argument("--password")
    a = a.parse_args()
    pw = a.password or getpass.getpass("Password: ")
    if len(pw) < 8:
        sys.exit("Password must be at least 8 characters")
    env = dict(os.environ, PGPASSWORD=os.environ.get("DB_PASSWORD", "postgres"))
    sql = """INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, org_code)
SELECT gen_random_uuid(), id, :'name', :'email', :'hash', :'role', NULLIF(:'org','') FROM tenants WHERE airport_code = :'airport'
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, org_code = EXCLUDED.org_code, tenant_id = EXCLUDED.tenant_id
RETURNING email;"""
    r = subprocess.run(
        ["psql", "-h", os.environ.get("DB_HOST", "localhost"), "-p", os.environ.get("DB_PORT", "5432"),
         "-U", os.environ.get("DB_USER", "postgres"), "-d", os.environ.get("DB_NAME", "aerobase"),
         "-v", "ON_ERROR_STOP=1", "-v", f"name={a.name}", "-v", f"email={a.email}",
         "-v", f"hash={hash_pw(pw)}", "-v", f"role={a.role}", "-v", f"org={a.org}", "-v", f"airport={a.airport}",
         "-tA", "-f", "-"],
        input=sql, text=True, capture_output=True, env=env)
    if r.returncode or not r.stdout.strip():
        sys.exit(r.stderr.strip() or f"No tenant with airport_code {a.airport}")
    print(f"OK: {r.stdout.strip()}")


if __name__ == "__main__":
    main()
