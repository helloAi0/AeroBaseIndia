#!/usr/bin/env python3
"""
Integration tests for the AeroBase API. Needs a running backend with migrations applied and `scripts/seed_demo.py` run.

    BASE_URL=http://localhost:8080 DEMO_PASSWORD=Demo-Pass-2026x python3 scripts/integration_test.py
"""
import json, os, sys, time, unittest, urllib.error, urllib.request, uuid

BASE = os.environ.get("BASE_URL", "http://localhost:8080").rstrip("/")
PW = os.environ.get("DEMO_PASSWORD", "Demo-Pass-2026x")
RUN = uuid.uuid4().hex[:6].upper()          # unique per run so reruns never collide
_tokens = {}


def call(method, path, body=None, token=None, headers=None, raw=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = {"Content-Type": "application/json", **(headers or {})}
    if token: h["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=15) as r: code, txt = r.status, r.read().decode()
    except urllib.error.HTTPError as e: code, txt = e.code, e.read().decode()
    try: js = json.loads(txt)
    except Exception: js = txt
    return code, js


def login(email):
    if email not in _tokens:
        code, js = call("POST", "/login", {"email": email, "password": PW})
        assert code == 200 and isinstance(js, dict) and js.get("token"), f"login {email} failed: {code} {js}"
        _tokens[email] = js["token"]
    return _tokens[email]


ADMIN, BOM_ADMIN = "admin@del.aerobase.in", "admin@bom.aerobase.in"
STAFF, SEC = "staff@del.aerobase.in", "security@del.aerobase.in"
OPS, PILOT = "ops@indigo.del.aerobase.in", "captain@airindia.del.aerobase.in"
SHOP, PAX, OWNER = "shop@del.aerobase.in", "passenger@del.aerobase.in", "owner@aerobase.in"
ROLES = {ADMIN: "AIRPORT_ADMIN", BOM_ADMIN: "AIRPORT_ADMIN", STAFF: "GROUND_STAFF", SEC: "SECURITY_OFFICER", OPS: "AIRLINE_OPS",
         PILOT: "PILOT", SHOP: "RETAILER", PAX: "PASSENGER", OWNER: "SUPER_ADMIN"}


def claims(token):
    import base64
    p = token.split(".")[1]; p += "=" * (-len(p) % 4)
    return json.loads(base64.urlsafe_b64decode(p))


def flights(email):
    code, js = call("GET", "/flights", token=login(email))
    assert code == 200, (code, js)
    return js if isinstance(js, list) else js.get("flights", js)


def future(days=3, hh="09:15"):
    return time.strftime("%Y-%m-%d", time.gmtime(time.time() + days * 86400)) + " " + hh


class Auth(unittest.TestCase):
    def test_health(self):
        code, js = call("GET", "/health"); self.assertEqual(code, 200); self.assertEqual(js["database"], "UP"); self.assertEqual(js["status"], "healthy")

    def test_login_every_role_carries_expected_claims(self):
        for email, role in ROLES.items():
            c = claims(login(email)); self.assertEqual(c["role"], role, email)
            self.assertTrue(c.get("tenant_id") and c.get("user_id"), email); self.assertGreater(c["exp"], time.time())
        self.assertEqual(claims(login(OPS)).get("org"), "6E"); self.assertEqual(claims(login(PILOT)).get("org"), "AI")

    def test_bad_credentials_rejected(self):
        for body in ({"email": ADMIN, "password": "wrong-password"}, {"email": "nobody@x.in", "password": PW}, {"email": ADMIN}, {}):
            code, js = call("POST", "/login", body); self.assertIn(code, (400, 401), body); self.assertFalse(isinstance(js, dict) and js.get("token"))
        code, _ = call("POST", "/login", raw=b"{not json"); self.assertIn(code, (400, 401))

    def test_garbage_and_expired_tokens_rejected(self):
        for t in ("abc", "a.b.c", login(ADMIN)[:-4] + "AAAA"):
            code, _ = call("GET", "/api/records/incidents", token=t); self.assertEqual(code, 401, t)


class RouteGuard(unittest.TestCase):
    def test_anonymous_gets_401(self):
        for method, path in (("GET", "/api/records/incidents"), ("GET", "/api/flights"), ("POST", "/api/flights"), ("GET", "/api/tenants"),
                             ("GET", "/api/partner-keys"), ("GET", "/metrics"), ("GET", "/audit/logs"), ("GET", "/api/billing/current-plan"), ("PATCH", "/flights/" + str(uuid.uuid4()))):
            code, _ = call(method, path, {} if method != "GET" else None); self.assertEqual(code, 401, f"{method} {path}")

    def test_non_admin_gets_403_on_admin_routes(self):
        for who in (STAFF, SEC, OPS, PILOT, SHOP, PAX):
            for path in ("/api/tenants", "/metrics", "/api/partner-keys", "/api/billing/current-plan"):
                code, _ = call("GET", path, token=login(who)); self.assertEqual(code, 403, f"{who} {path}")

    def test_tenants_only_for_super_admin(self):
        code, _ = call("GET", "/api/tenants", token=login(ADMIN)); self.assertEqual(code, 403)
        code, js = call("GET", "/api/tenants", token=login(OWNER)); self.assertEqual(code, 200)
        self.assertGreaterEqual(len(js["tenants"]), 3); self.assertTrue({"DEL", "BOM", "BLR"} <= {t["code"] for t in js["tenants"]})

    def test_public_endpoints_open(self):
        self.assertEqual(call("GET", "/health")[0], 200)


class TenantIsolation(unittest.TestCase):
    def test_flights_are_per_airport(self):
        d, b = flights(ADMIN), flights(BOM_ADMIN)
        self.assertTrue(d and b); self.assertFalse({f["id"] for f in d} & {f["id"] for f in b})
        self.assertTrue(all(f["origin"] == "DEL" or f["destination"] == "DEL" for f in d), "DEL board shows non-DEL flights")

    def test_records_are_per_airport_and_cross_tenant_edit_blocked(self):
        code, rec = call("POST", "/api/records/incidents", {"title": f"iso-{RUN}", "severity": "LOW"}, login(ADMIN)); self.assertEqual(code, 201)
        seen = call("GET", "/api/records/incidents", token=login(BOM_ADMIN))[1]["records"]
        self.assertNotIn(rec["id"], [r["id"] for r in seen])
        self.assertEqual(call("PUT", f"/api/records/incidents/{rec['id']}", {"status": "Resolved"}, login(BOM_ADMIN))[0], 404)
        self.assertEqual(call("DELETE", f"/api/records/incidents/{rec['id']}", token=login(BOM_ADMIN))[0], 404)
        self.assertEqual(call("DELETE", f"/api/records/incidents/{rec['id']}", token=login(ADMIN))[0], 200)

    def test_patch_flight_of_other_airport_404(self):
        bom_id = flights(BOM_ADMIN)[0]["id"]
        self.assertEqual(call("PATCH", f"/flights/{bom_id}", {"gate": "Z9"}, login(ADMIN))[0], 404)

    def test_client_supplied_tenant_headers_are_ignored(self):
        before = {f["id"] for f in flights(BOM_ADMIN)}
        code, js = call("GET", "/flights", token=login(ADMIN), headers={"X-Tenant-ID": "BOM"})
        got = {f["id"] for f in (js if isinstance(js, list) else js["flights"])}; self.assertFalse(got & before)


class OrgScoping(unittest.TestCase):
    def test_airline_ops_and_pilot_only_see_own_airline(self):
        for who, code in ((OPS, "6E"), (PILOT, "AI")):
            fl = flights(who); self.assertTrue(fl, who)
            self.assertTrue(all(str(f.get("airline_code", "")).upper() == code or str(f["flight_number"]).upper().startswith(code) for f in fl), who)
        self.assertLess(len(flights(OPS)), len(flights(ADMIN)))


class FlightCRUD(unittest.TestCase):
    def new(self, **o):
        b = {"flight_number": f"T{RUN[0]}-{int(time.time() * 1000) % 9000 + 100}", "origin": "DEL", "destination": "BOM", "departure_time": future(5, "07:%02d" % (int(time.time()) % 60)),
             "gate": "A7", "terminal": "T3", "aircraft": "A320", "airline_code": "TT", "airline": "Test", "passengers": 100}; b.update(o); return b

    def test_create_then_duplicate_conflict_then_visible(self):
        b = self.new(); code, js = call("POST", "/api/flights", b, login(ADMIN)); self.assertEqual(code, 201, js); fid = js["id"]
        self.assertEqual(call("POST", "/api/flights", b, login(ADMIN))[0], 409)
        self.assertIn(fid, [f["id"] for f in flights(ADMIN)])
        self.assertNotIn(fid, [f["id"] for f in flights(BOM_ADMIN)])

    def test_validation(self):
        bad = [self.new(flight_number="bad number!"), self.new(origin="D", destination="BOM"), self.new(origin="DEL", destination="DEL"), self.new(departure_time="tomorrow"),
               self.new(passengers=-1), self.new(passengers=100000), self.new(gate="g" * 40), {}]
        for b in bad: self.assertEqual(call("POST", "/api/flights", b, login(ADMIN))[0], 400, b)

    def test_create_role_limits(self):
        for who in (PAX, SHOP, PILOT):
            code, _ = call("POST", "/api/flights", self.new(), login(who)); self.assertIn(code, (401, 403), who)

    def test_patch_role_limits_and_validation(self):
        code, js = call("POST", "/api/flights", self.new(), login(ADMIN)); fid = js["id"]
        for who in (PAX, SHOP, PILOT, OPS): self.assertEqual(call("PATCH", f"/flights/{fid}", {"gate": "B1"}, login(who))[0], 403, who)
        for who in (ADMIN, STAFF): self.assertEqual(call("PATCH", f"/flights/{fid}", {"status": "Delayed", "delay_minutes": 25, "issue": "Fog"}, login(who))[0], 200, who)
        row = next(f for f in flights(ADMIN) if f["id"] == fid)
        self.assertEqual((row["status"], row["delay_minutes"], row["issue"]), ("Delayed", 25, "Fog"))
        for bad in ({"status": "Exploded"}, {"delay_minutes": -5}, {"delay_minutes": 99999}, {"gate": "bad gate!"}, {"issue": "x" * 400}):
            self.assertEqual(call("PATCH", f"/flights/{fid}", bad, login(ADMIN))[0], 400, bad)
        self.assertEqual(call("PATCH", "/flights/not-a-uuid", {"gate": "A1"}, login(ADMIN))[0], 400)
        self.assertEqual(call("PATCH", f"/flights/{uuid.uuid4()}", {"gate": "A1"}, login(ADMIN))[0], 404)


class Records(unittest.TestCase):
    def test_crud_lifecycle(self):
        t = login(ADMIN); code, r = call("POST", "/api/records/maintenance", {"aircraft": f"VT-{RUN}", "desc": "check", "status": "Scheduled"}, t)
        self.assertEqual(code, 201); self.assertEqual(r["aircraft"], f"VT-{RUN}"); rid = r["id"]
        self.assertIn(rid, [x["id"] for x in call("GET", "/api/records/maintenance", token=t)[1]["records"]])
        code, u = call("PUT", f"/api/records/maintenance/{rid}", {"status": "Completed"}, t); self.assertEqual(code, 200)
        self.assertEqual((u["status"], u["aircraft"]), ("Completed", f"VT-{RUN}"))           # merge, not replace
        self.assertEqual(call("DELETE", f"/api/records/maintenance/{rid}", token=t)[0], 200)
        self.assertEqual(call("DELETE", f"/api/records/maintenance/{rid}", token=t)[0], 404)

    def test_role_policy(self):
        self.assertEqual(call("POST", "/api/records/staff", {"name": "x"}, login(PAX))[0], 403)
        self.assertEqual(call("POST", "/api/records/staff", {"name": "x"}, login(STAFF))[0], 403)       # admin only
        self.assertEqual(call("GET", "/api/records/staff", token=login(SHOP))[0], 403)
        self.assertEqual(call("GET", "/api/records/contracts", token=login(STAFF))[0], 403)
        self.assertEqual(call("POST", "/api/records/security_events", {"title": "t"}, login(STAFF))[0], 403)
        code, r = call("POST", "/api/records/security_events", {"title": f"s-{RUN}"}, login(SEC)); self.assertEqual(code, 201)
        call("DELETE", f"/api/records/security_events/{r['id']}", token=login(SEC))
        code, r = call("POST", "/api/records/feedback", {"rating": 5, "comment": f"fb-{RUN}"}, login(PAX)); self.assertEqual(code, 201)   # passengers may submit
        self.assertEqual(call("GET", "/api/records/feedback", token=login(PAX))[0], 403)                                                   # but not read all
        call("DELETE", f"/api/records/feedback/{r['id']}", token=login(ADMIN))

    def test_validation_and_limits(self):
        t = login(ADMIN)
        self.assertEqual(call("POST", "/api/records/nonexistent", {"a": 1}, t)[0], 404)
        self.assertEqual(call("GET", "/api/records/nonexistent", token=t)[0], 404)
        self.assertEqual(call("POST", "/api/records/incidents", raw=b"[1,2]", token=t)[0], 400)
        self.assertEqual(call("POST", "/api/records/incidents", raw=b"not json", token=t)[0], 400)
        self.assertEqual(call("POST", "/api/records/incidents", {}, t)[0], 400)
        self.assertEqual(call("POST", "/api/records/incidents", {"title": "x" * 9000}, t)[0], 400)
        self.assertEqual(call("PUT", "/api/records/incidents/not-a-uuid", {"a": 1}, t)[0], 400)
        self.assertEqual(call("PUT", f"/api/records/incidents/{uuid.uuid4()}", {"a": 1}, t)[0], 404)

    def test_client_cannot_forge_id_or_created_at(self):
        t = login(ADMIN); fake = str(uuid.uuid4()); code, r = call("POST", "/api/records/parking", {"slot": f"P-{RUN}", "id": fake, "created_at": "1999-01-01"}, t)
        self.assertEqual(code, 201); self.assertNotEqual(r["id"], fake); self.assertNotEqual(r.get("created_at", "")[:4], "1999"); call("DELETE", f"/api/records/parking/{r['id']}", token=t)

    def test_unicode_and_injection_strings_stored_verbatim(self):
        t = login(ADMIN); evil = "'; DROP TABLE app_records;-- ✈ \"quoted\" <script>x</script>"
        code, r = call("POST", "/api/records/lostfound", {"item": evil}, t); self.assertEqual(code, 201); self.assertEqual(r["item"], evil)
        self.assertEqual(call("GET", "/api/records/lostfound", token=t)[0], 200); call("DELETE", f"/api/records/lostfound/{r['id']}", token=t)


class Bids(unittest.TestCase):
    def test_retailer_bid_visible_only_to_owner_and_admin_can_accept(self):
        code, bid = call("POST", "/api/records/bids", {"space": f"Kiosk-{RUN}", "amount": 50000, "status": "Pending"}, login(SHOP)); self.assertEqual(code, 201, bid)
        self.assertEqual(call("POST", "/api/records/bids", {"space": "x"}, login(PAX))[0], 403)
        self.assertEqual(call("POST", "/api/records/bids", {"space": "x"}, login(ADMIN))[0], 403)           # only retailers bid
        self.assertEqual(call("PUT", f"/api/records/bids/{bid['id']}", {"status": "Accepted"}, login(SHOP))[0], 403)   # cannot self-accept
        self.assertIn(bid["id"], [b["id"] for b in call("GET", "/api/records/bids", token=login(SHOP))[1]["records"]])
        code, upd = call("PUT", f"/api/records/bids/{bid['id']}", {"status": "Accepted"}, login(ADMIN)); self.assertEqual(code, 200); self.assertEqual(upd["status"], "Accepted")
        self.assertIn(bid["id"], [b["id"] for b in call("GET", "/api/records/bids", token=login(ADMIN))[1]["records"]])
        call("DELETE", f"/api/records/bids/{bid['id']}", token=login(ADMIN))

    def test_other_retailer_cannot_see_bid(self):
        code, bid = call("POST", "/api/records/bids", {"space": f"Own-{RUN}", "amount": 1}, login(SHOP)); self.assertEqual(code, 201)
        other = "shop@bom.aerobase.in"; self.assertNotIn(bid["id"], [b["id"] for b in call("GET", "/api/records/bids", token=login(other))[1]["records"]])
        call("DELETE", f"/api/records/bids/{bid['id']}", token=login(ADMIN))


class Billing(unittest.TestCase):
    def test_plan_read_change_restore(self):
        t = login(ADMIN); code, cur = call("GET", "/api/billing/current-plan", token=t); self.assertEqual(code, 200); orig = cur["plan"]; self.assertTrue(cur["tenant_id"])
        target = "STANDARD" if orig != "STANDARD" else "PREMIUM"
        try:
            self.assertEqual(call("POST", "/api/billing/upgrade", {"plan_id": target}, t)[0], 200)
            self.assertEqual(call("GET", "/api/billing/current-plan", token=t)[1]["plan"], target)
        finally:
            call("POST", "/api/billing/upgrade", {"plan_id": orig}, t)
        self.assertEqual(call("GET", "/api/billing/current-plan", token=t)[1]["plan"], orig)

    def test_unknown_plan_400_and_nonadmin_403(self):
        self.assertEqual(call("POST", "/api/billing/upgrade", {"plan_id": "GOLD-PLATED"}, login(ADMIN))[0], 400)
        self.assertEqual(call("POST", "/api/billing/upgrade", {"plan_id": "STANDARD"}, login(SHOP))[0], 403)
        self.assertEqual(call("GET", "/api/billing/current-plan", token=login(SHOP))[0], 403)

    def test_plan_is_per_tenant(self):
        a, b = call("GET", "/api/billing/current-plan", token=login(ADMIN))[1], call("GET", "/api/billing/current-plan", token=login(BOM_ADMIN))[1]
        self.assertNotEqual(a["tenant_id"], b["tenant_id"])


class Partner(unittest.TestCase):
    def test_key_lifecycle_and_sync(self):
        t = login(ADMIN); pid = f"airline-{RUN.lower()}"
        code, k = call("POST", "/api/partner-keys", {"partner_id": pid, "label": "integration test"}, t); self.assertEqual(code, 201, k); key = k["api_key"]
        self.assertGreaterEqual(len(key), 20); self.assertNotIn(key, json.dumps(call("GET", "/api/partner-keys", token=t)[1]))        # raw key never listed
        self.assertIn(pid, json.dumps(call("GET", "/api/partner-keys", token=t)[1]))
        H = {"X-API-Key": key, "X-Partner-Id": pid}
        fn = f"P{RUN[0]}-{int(time.time()) % 9000 + 100}"; dep = future(6, "05:45")
        body = {"flight_number": fn, "origin": "DEL", "destination": "GOI", "departure_time": dep, "gate": "C4"}
        self.assertEqual(call("POST", "/api/partner/flights/sync", body, headers=H)[0], 200)
        self.assertEqual(call("POST", "/api/partner/flights/sync", {**body, "gate": "C5"}, headers=H)[0], 200)             # idempotent upsert
        rows = [f for f in flights(ADMIN) if f["flight_number"] == fn]; self.assertEqual(len(rows), 1); self.assertEqual(rows[0]["gate"], "C5")
        self.assertFalse([f for f in flights(BOM_ADMIN) if f["flight_number"] == fn])                                      # lands only in the key's airport
        self.assertEqual(call("POST", "/api/partner/flights/sync", {**body, "flight_number": "bad!"}, headers=H)[0], 400)
        self.assertEqual(call("POST", "/api/partner/flights/sync", {**body, "departure_time": "soon"}, headers=H)[0], 400)
        self.assertEqual(call("POST", "/api/partner/flights/sync", body, headers={"X-API-Key": "wrong", "X-Partner-Id": pid})[0], 401)
        self.assertEqual(call("POST", "/api/partner/flights/sync", body)[0], 401)
        kid = next(x["id"] for x in call("GET", "/api/partner-keys", token=t)[1]["keys"] if x["partner_id"] == pid)
        self.assertEqual(call("DELETE", f"/api/partner-keys/{kid}", token=t)[0], 200)
        self.assertEqual(call("POST", "/api/partner/flights/sync", body, headers=H)[0], 401)                               # revoked key stops working

    def test_partner_key_validation_and_authz(self):
        self.assertEqual(call("POST", "/api/partner-keys", {"partner_id": "bad id!"}, login(ADMIN))[0], 400)
        self.assertEqual(call("POST", "/api/partner-keys", {"partner_id": "okid"}, login(STAFF))[0], 403)
        self.assertEqual(call("DELETE", f"/api/partner-keys/{uuid.uuid4()}", token=login(BOM_ADMIN))[0], 404)


class Audit(unittest.TestCase):
    def test_actions_are_audited_and_tenant_scoped(self):
        t = login(ADMIN); code, r = call("POST", "/api/records/fuel", {"aircraft": f"AUD-{RUN}", "litres": 10}, t); self.assertEqual(code, 201)
        code, js = call("GET", "/audit/logs?action=RECORD_CREATED&limit=100", token=t); self.assertEqual(code, 200)
        self.assertTrue(js["logs"] and all(l["action"] == "RECORD_CREATED" for l in js["logs"]))
        self.assertTrue(any(l["entity_type"] == "fuel" for l in js["logs"]))
        self.assertTrue(any(l["action"] == "LOGIN" for l in call("GET", "/audit/logs?action=LOGIN&limit=50", token=t)[1]["logs"]))
        self.assertNotIn("tenant_id", js["logs"][0])                                                     # only super-admin sees tenant ids
        call("DELETE", f"/api/records/fuel/{r['id']}", token=t)
        self.assertTrue(any(l["action"] == "RECORD_DELETED" for l in call("GET", "/audit/logs?action=RECORD_DELETED&limit=20", token=t)[1]["logs"]))
        self.assertEqual(call("GET", "/audit/logs", token=login(PAX))[0], 403)

    def test_failed_login_is_audited_or_at_least_rejected(self):
        self.assertEqual(call("POST", "/login", {"email": ADMIN, "password": "nope-nope"})[0], 401)

    def test_limit_clamped(self):
        code, js = call("GET", "/audit/logs?limit=999999&offset=-5", token=login(ADMIN)); self.assertEqual(code, 200); self.assertLessEqual(js["limit"], 200); self.assertEqual(js["offset"], 0)


class Hostile(unittest.TestCase):
    PAYLOADS = ["'", "' OR '1'='1", "1; DROP TABLE flights;--", "%27%20OR%201%3D1", "../../etc/passwd", "\u0000", "a" * 3000, "%", "{{7*7}}"]

    def test_no_500_from_hostile_query_and_path_params(self):
        t = login(ADMIN)
        for p in self.PAYLOADS:
            q = urllib.request.quote(p, safe="%")
            for path in (f"/audit/logs?action={q}&limit={q}&offset={q}", f"/api/records/{q}", f"/api/records/incidents/{q}", f"/flights/{q}", f"/flights?x={q}"):
                for method in ("GET", "DELETE", "PATCH") if "/flights/" in path else ("GET", "DELETE"):
                    code, _ = call(method, path, {} if method == "PATCH" else None, t); self.assertLess(code, 500, f"{method} {path[:60]} -> {code}")

    def test_no_500_from_hostile_login_and_bodies(self):
        for p in self.PAYLOADS:
            self.assertLess(call("POST", "/login", {"email": p, "password": p})[0], 500, p[:20])
            self.assertLess(call("POST", "/api/flights", {"flight_number": p, "origin": p, "destination": p, "departure_time": p}, login(ADMIN))[0], 500, p[:20])
            self.assertLess(call("POST", "/api/records/incidents", {"title": p}, login(ADMIN))[0], 500, p[:20])
        for raw in (b"", b"null", b"[]", b'{"a":', b'"str"', b"\xff\xfe"):
            self.assertLess(call("POST", "/api/flights", raw=raw, token=login(ADMIN))[0], 500, raw)
            self.assertLess(call("POST", "/login", raw=raw)[0], 500, raw)

    def test_injection_does_not_leak_other_tenants_data(self):
        evil = urllib.request.quote("' OR '1'='1"); code, js = call("GET", f"/audit/logs?action={evil}", token=login(ADMIN)); self.assertEqual(code, 200); self.assertEqual(js["logs"], [])



class CorsReferenceBiometric(unittest.TestCase):
    def test_cors_preflight_allows_patch(self):
        import urllib.request
        rq = urllib.request.Request(BASE + "/flights/x", method="OPTIONS", headers={"Origin": "http://example.test", "Access-Control-Request-Method": "PATCH"})
        with urllib.request.urlopen(rq) as r: self.assertIn("PATCH", r.headers.get("Access-Control-Allow-Methods", ""))

    def test_reference_data(self):
        t = login(ADMIN)
        code, js = call("GET", "/api/reference/airports", token=t); self.assertEqual(code, 200)
        codes = {a["iata"] for a in js["airports"]}; self.assertTrue({"DEL", "BOM", "BLR", "ZRH", "LHR"} <= codes); self.assertGreaterEqual(len(codes), 50)
        code, js = call("GET", "/api/reference/aircraft", token=t); self.assertEqual(code, 200); self.assertTrue(all(a["seats"] > 0 and a["fuel_kg_per_hour"] > 0 for a in js["aircraft"]))
        self.assertEqual(call("GET", "/api/reference/airlines", token=t)[0], 200)
        self.assertEqual(call("GET", "/api/reference/secrets", token=t)[0], 404)
        self.assertEqual(call("GET", "/api/reference/airports")[0], 401)

    def test_real_routes_and_airport_facts(self):
        t = login(ADMIN)
        code, js = call("GET", "/api/reference/routes?from=DEL", token=t); self.assertEqual(code, 200)
        dests = {r["to"] for r in js["routes"]}; self.assertTrue({"BOM", "BLR"} <= dests); self.assertGreater(len(js["routes"]), 100)
        self.assertEqual(call("GET", "/api/reference/routes", token=t)[0], 400)
        code, js = call("GET", "/api/reference/airports", token=t); delhi = next(a for a in js["airports"] if a["iata"] == "DEL")
        self.assertGreaterEqual(delhi["runways"], 3); self.assertGreater(delhi["longest_runway_m"], 3000)

    def test_no_defunct_airlines_in_schedule(self):
        code, js = call("GET", "/flights", token=login(ADMIN)); rows = js if isinstance(js, list) else js.get("flights", [])
        self.assertFalse([r for r in rows if r.get("flight_number", "").split("-")[0] in ("UK", "I5", "9W", "G8")])

    def test_generated_schedule_is_realistic(self):
        code, js = call("GET", "/flights", token=login(ADMIN)); rows = js if isinstance(js, list) else js.get("flights", [])
        self.assertGreater(len(rows), 50)

    def test_passkey_endpoints_guarded_and_validated(self):
        self.assertEqual(call("POST", "/api/biometric/register/options")[0], 401)
        self.assertEqual(call("POST", "/api/biometric/assert/options")[0], 401)
        t = login(PAX)
        code, js = call("POST", "/api/biometric/register/options", token=t); self.assertEqual(code, 200); self.assertGreaterEqual(len(js["challenge"]), 40)
        self.assertEqual(call("POST", "/api/biometric/register/verify", {"clientDataJSON": "e30", "attestationObject": "oA"}, token=t)[0], 400)
        self.assertEqual(call("POST", "/api/biometric/assert/verify", {"credentialId": "x", "clientDataJSON": "e30", "authenticatorData": "AA", "signature": "AA"}, token=t)[0], 400)
        self.assertEqual(call("DELETE", "/api/biometric/credentials/00000000-0000-0000-0000-000000000000", token=t)[0], 404)


# ── Payments / WhatsApp / integrations ────────────────────────────────────────────────────────────────
# The gateway-dependent tests need the backend started with env pointing at the local mock (see scripts/run-tests.sh):
#   RAZORPAY_KEY_ID=rzp_test_mock RAZORPAY_KEY_SECRET=mocksecret RAZORPAY_API_BASE=http://127.0.0.1:18099
#   STRIPE_SECRET_KEY=sk_test_mock STRIPE_API_BASE=http://127.0.0.1:18099 STRIPE_WEBHOOK_SECRET=whsec_mock
#   WHATSAPP_APP_SECRET=wa_secret WHATSAPP_VERIFY_TOKEN=wa_verify WHATSAPP_TOKEN=wa_token WHATSAPP_PHONE_NUMBER_ID=12345 WHATSAPP_API_BASE=http://127.0.0.1:18099
# and INTEGRATION_MOCKS=1 for this script.
import hashlib, hmac, threading, http.server, socketserver

MOCKS = os.environ.get("INTEGRATION_MOCKS") == "1"
MOCK_PORT = int(os.environ.get("MOCK_PORT", "18099"))
MOCK_LOG = []   # (path, headers, body)


class _Mock(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0))).decode()
        MOCK_LOG.append((self.path, {k.title(): v for k, v in self.headers.items()}, body))
        if self.path == "/v1/orders": out = {"id": "order_MOCK" + uuid.uuid4().hex[:8]}
        elif self.path == "/v1/payment_intents": out = {"id": "pi_mock" + uuid.uuid4().hex[:8], "client_secret": "pi_secret_mock"}
        else: out = {"messages": [{"id": "wamid.mock"}]}
        data = json.dumps(out).encode(); self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)


def setUpModule():
    if MOCKS:
        socketserver.TCPServer.allow_reuse_address = True
        srv = socketserver.ThreadingTCPServer(("127.0.0.1", MOCK_PORT), _Mock); srv.daemon_threads = True
        threading.Thread(target=srv.serve_forever, daemon=True).start()


class Payments(unittest.TestCase):
    def test_guard_and_validation(self):
        self.assertEqual(call("POST", "/payments/order", {"invoice_id": "X", "amount": 5})[0], 401)
        self.assertEqual(call("POST", "/payments/order", {"invoice_id": "X", "amount": 5}, token=login(STAFF))[0], 403)
        self.assertEqual(call("GET", "/payments/config", token=login(STAFF))[0], 403)
        t = login(ADMIN)
        for bad in ({"invoice_id": "", "amount": 5}, {"invoice_id": "I1", "amount": -1}, {"invoice_id": "I1", "amount": 5, "currency": "rupees"},
                    {"invoice_id": "I1", "amount": 5, "gateway": "paypal"}, {"invoice_id": "I<script>", "amount": 5}):
            self.assertEqual(call("POST", "/payments/order", bad, token=t)[0], 400, bad)

    def test_unconfigured_gateway_returns_503_not_a_fake_order(self):
        t = login(ADMIN); cfg = call("GET", "/payments/config", token=t)[1]
        if not cfg["razorpay"]: self.assertEqual(call("POST", "/payments/order", {"invoice_id": "I1", "amount": 5}, token=t)[0], 503)
        if not cfg["stripe"]: self.assertEqual(call("POST", "/payments/order", {"invoice_id": "I1", "amount": 5, "gateway": "stripe"}, token=t)[0], 503)
        if not cfg["razorpay"] and not cfg["stripe"]:
            self.assertEqual(call("POST", "/payments/webhook/razorpay", raw=b"{}", headers={"X-Razorpay-Signature": "x"})[0], 400)   # no secret => always rejected

    def test_config_reports_no_secrets(self):
        code, js = call("GET", "/payments/config", token=login(ADMIN)); self.assertEqual(code, 200)
        self.assertIn("razorpay", js); self.assertIn("stripe", js); self.assertNotIn("secret", json.dumps(js).lower().replace("razorpay_key_id", ""))

    @unittest.skipUnless(MOCKS, "needs the mock gateway env (see header)")
    def test_razorpay_order_is_real_and_tenant_scoped(self):
        n0 = len(MOCK_LOG); t = login(ADMIN)
        # a tenant header from the client must be ignored
        code, js = call("POST", "/payments/order", {"invoice_id": f"INV-{RUN}", "amount": 1234.5, "currency": "INR"}, token=t, headers={"X-Tenant-ID": "BOM"})
        self.assertEqual(code, 200, js); self.assertTrue(js["gateway_ref"].startswith("order_MOCK")); self.assertEqual(js["key_id"], "rzp_test_mock")
        self.assertNotIn("checkout_url", js); self.assertNotIn("mocksecret", json.dumps(js))
        path, hdr, body = MOCK_LOG[n0]; self.assertEqual(path, "/v1/orders")
        self.assertEqual(json.loads(body)["amount"], 123450)   # paise
        import base64
        self.assertEqual(base64.b64decode(hdr.get("Authorization").split()[1]).decode(), "rzp_test_mock:mocksecret")
        oid = js["order_id"]
        self.assertEqual(call("GET", f"/payments/order/{oid}", token=t)[0], 200)
        self.assertEqual(call("GET", f"/payments/order/{oid}", token=login(BOM_ADMIN))[0], 404)    # other airport cannot read it
        code, lst = call("GET", "/payments/orders", token=t); self.assertIn(oid, [o["order_id"] for o in lst["orders"]])
        code, lst = call("GET", "/payments/orders", token=login(BOM_ADMIN)); self.assertNotIn(oid, [o["order_id"] for o in lst["orders"]])
        # signed webhook marks it paid; forged one is rejected
        ev = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {"id": "pay_1", "order_id": js["gateway_ref"]}}}}).encode()
        self.assertEqual(call("POST", "/payments/webhook/razorpay", raw=ev, headers={"X-Razorpay-Signature": "0" * 64})[0], 400)
        sig = hmac.new(b"mocksecret", ev, hashlib.sha256).hexdigest()
        self.assertEqual(call("POST", "/payments/webhook/razorpay", raw=ev, headers={"X-Razorpay-Signature": sig})[0], 200)
        self.assertEqual(call("GET", f"/payments/order/{oid}", token=t)[1]["status"], "PAID")

    @unittest.skipUnless(MOCKS, "needs the mock gateway env (see header)")
    def test_stripe_order_and_webhook(self):
        n0 = len(MOCK_LOG); t = login(ADMIN)
        code, js = call("POST", "/payments/order", {"invoice_id": f"INS-{RUN}", "amount": 10, "currency": "USD", "gateway": "stripe"}, token=t)
        self.assertEqual(code, 200, js); self.assertTrue(js["gateway_ref"].startswith("pi_mock")); self.assertEqual(js["client_secret"], "pi_secret_mock")
        path, hdr, body = MOCK_LOG[n0]; self.assertEqual(path, "/v1/payment_intents"); self.assertIn("amount=1000", body); self.assertIn("currency=usd", body)
        self.assertEqual(hdr.get("Authorization"), "Bearer sk_test_mock")
        ev = json.dumps({"type": "payment_intent.succeeded", "data": {"object": {"id": js["gateway_ref"]}}}).encode(); ts = str(int(time.time()))
        good = hmac.new(b"whsec_mock", ts.encode() + b"." + ev, hashlib.sha256).hexdigest()
        self.assertEqual(call("POST", "/payments/webhook/stripe", raw=ev, headers={"Stripe-Signature": f"t={ts},v1={'0'*64}"})[0], 400)
        old = str(int(time.time()) - 4000); oldsig = hmac.new(b"whsec_mock", old.encode() + b"." + ev, hashlib.sha256).hexdigest()
        self.assertEqual(call("POST", "/payments/webhook/stripe", raw=ev, headers={"Stripe-Signature": f"t={old},v1={oldsig}"})[0], 400)   # replay window
        self.assertEqual(call("POST", "/payments/webhook/stripe", raw=ev, headers={"Stripe-Signature": f"t={ts},v1={good}"})[0], 200)
        self.assertEqual(call("GET", f"/payments/order/{js['order_id']}", token=t)[1]["status"], "PAID")


class WhatsAppAndIntegrations(unittest.TestCase):
    SECRET = os.environ.get("WHATSAPP_APP_SECRET", "wa_secret").encode()

    def _post(self, text, sign=True, frm="919999900001"):
        body = json.dumps({"entry": [{"changes": [{"value": {"messages": [{"from": frm, "type": "text", "text": {"body": text}}]}}]}]}).encode()
        sig = "sha256=" + hmac.new(self.SECRET if sign else b"wrong", body, hashlib.sha256).hexdigest()
        return call("POST", "/webhooks/whatsapp", raw=body, headers={"X-Hub-Signature-256": sig})

    @unittest.skipUnless(MOCKS, "needs the mock WhatsApp env (see header)")
    def test_verify_handshake(self):
        def get(q):
            try:
                with urllib.request.urlopen(BASE + "/webhooks/whatsapp?" + q) as r: return r.status, r.read().decode()
            except urllib.error.HTTPError as e: return e.code, ""
        self.assertEqual(get("hub.mode=subscribe&hub.verify_token=wa_verify&hub.challenge=abc123"), (200, "abc123"))
        self.assertEqual(get("hub.mode=subscribe&hub.verify_token=nope&hub.challenge=abc123")[0], 403)
        self.assertEqual(get("hub.mode=subscribe&hub.challenge=abc123")[0], 403)

    @unittest.skipUnless(MOCKS, "needs the mock WhatsApp env (see header)")
    def test_unsigned_or_forged_is_rejected_and_nothing_is_sent(self):
        n0 = len(MOCK_LOG)
        self.assertEqual(self._post("hi", sign=False)[0], 403)
        self.assertEqual(call("POST", "/webhooks/whatsapp", {"entry": []})[0], 403)
        time.sleep(0.5); self.assertEqual(len(MOCK_LOG), n0)

    @unittest.skipUnless(MOCKS, "needs the mock WhatsApp env (see header)")
    def test_signed_message_gets_a_real_reply(self):
        fl = [f for f in flights(ADMIN) if f.get("flight_number")]
        self.assertTrue(fl); target = fl[0]["flight_number"]
        n0 = len(MOCK_LOG); self.assertEqual(self._post(f"status {target}")[0], 200)
        for _ in range(30):
            if len(MOCK_LOG) > n0: break
            time.sleep(0.2)
        path, hdr, body = MOCK_LOG[n0]; msg = json.loads(body)
        self.assertEqual(path, "/12345/messages"); self.assertEqual(hdr.get("Authorization"), "Bearer wa_token")
        self.assertEqual(msg["to"], "919999900001"); self.assertEqual(msg["messaging_product"], "whatsapp")
        self.assertIn(target, msg["text"]["body"]); self.assertIn("Status", msg["text"]["body"])
        n1 = len(MOCK_LOG); self._post("hello"); time.sleep(1.0)
        self.assertIn("AeroBase Assistant", json.loads(MOCK_LOG[n1][2])["text"]["body"])
        n2 = len(MOCK_LOG); self._post("flights to Mumbai"); time.sleep(1.0)
        self.assertRegex(json.loads(MOCK_LOG[n2][2])["text"]["body"], r"BOM|No flights")

    def test_integrations_status_admin_only_without_secrets(self):
        self.assertEqual(call("GET", "/api/integrations/status")[0], 401)
        self.assertEqual(call("GET", "/api/integrations/status", token=login(STAFF))[0], 403)
        code, js = call("GET", "/api/integrations/status", token=login(ADMIN)); self.assertEqual(code, 200)
        for k in ("whatsapp", "sms", "email", "razorpay", "stripe", "redis", "ml"): self.assertIsInstance(js[k], bool, k)
        self.assertNotIn("mocksecret", json.dumps(js))

    def test_notify_ignores_client_tenant_header(self):
        t = login(ADMIN)
        code, js = call("POST", "/notify/email", {"to": f"qa{RUN}@example.com", "subject": "t", "body": "b"}, token=t, headers={"X-Tenant-ID": "BOM"})
        if code == 200:
            code, q = call("GET", "/notify/queue", token=t); mine = [e for e in q["emails"] if e["to"] == f"qa{RUN}@example.com"]
            if mine: self.assertEqual(mine[-1]["tenantId"], claims(t)["tenant_id"])
        self.assertEqual(call("GET", "/notify/queue")[0], 401)


class Accounts(unittest.TestCase):
    def test_airport_list_is_public_and_wide(self):
        code, js = call("GET", "/api/public/airports")
        self.assertEqual(code, 200); codes = {a["code"] for a in js["airports"]}
        self.assertTrue({"DEL", "BOM", "BLR", "HYD", "CCU", "MAA", "SXR"} <= codes, codes)

    def test_signup_login_and_validation(self):
        em = f"su{RUN.lower()}@example.com"
        self.assertEqual(call("POST", "/api/auth/register", {"name": "A", "email": em, "password": "Sup3rsecret99", "airport": "DEL"})[0], 400)
        self.assertEqual(call("POST", "/api/auth/register", {"name": "Asha Rao", "email": "nope", "password": "Sup3rsecret99", "airport": "DEL"})[0], 400)
        self.assertEqual(call("POST", "/api/auth/register", {"name": "Asha Rao", "email": em, "password": "short", "airport": "DEL"})[0], 400)
        self.assertEqual(call("POST", "/api/auth/register", {"name": "Asha Rao", "email": em, "password": "Sup3rsecret99", "airport": "ZZZ"})[0], 400)
        self.assertEqual(call("POST", "/api/auth/register", {"name": "Asha Rao", "email": em, "password": "Sup3rsecret99", "airport": "SXR"})[0], 201)
        self.assertEqual(call("POST", "/api/auth/register", {"name": "Asha Rao", "email": em, "password": "Sup3rsecret99", "airport": "SXR"})[0], 409)
        code, js = call("POST", "/login", {"email": em, "password": "Sup3rsecret99"})
        self.assertEqual(code, 200); c = claims(js["token"]); self.assertEqual((c["role"], c["airport"]), ("PASSENGER", "SXR"))
        # a signup can never pick a privileged role
        e2 = f"sx{RUN.lower()}@example.com"
        call("POST", "/api/auth/register", {"name": "Evil Admin", "email": e2, "password": "Sup3rsecret99", "airport": "DEL", "account_type": "AIRPORT_ADMIN", "role": "SUPER_ADMIN"})
        self.assertEqual(claims(call("POST", "/login", {"email": e2, "password": "Sup3rsecret99"})[1]["token"])["role"], "PASSENGER")

    def test_forgot_and_reset_flow(self):
        em = f"fr{RUN.lower()}@example.com"
        call("POST", "/api/auth/register", {"name": "Reset Me", "email": em, "password": "Sup3rsecret99", "airport": "BOM"})
        code, js = call("POST", "/api/auth/forgot", {"email": em}); self.assertEqual(code, 200)
        code2, js2 = call("POST", "/api/auth/forgot", {"email": f"nobody{RUN.lower()}@example.com"})
        self.assertEqual((code2, js2["message"]), (200, js["message"]))          # no account enumeration
        self.assertEqual(call("POST", "/api/auth/reset", {"token": "x" * 64, "password": "NewPass12345"})[0], 400)
        link = js.get("reset_link")
        if not link: self.skipTest("set AUTH_DEV_RETURN_RESET_LINK=true to read the link without email")
        tok = link.split("token=")[1]
        self.assertEqual(call("POST", "/api/auth/reset", {"token": tok, "password": "weak"})[0], 400)
        self.assertEqual(call("POST", "/api/auth/reset", {"token": tok, "password": "NewPass12345"})[0], 200)
        self.assertEqual(call("POST", "/api/auth/reset", {"token": tok, "password": "NewPass12345"})[0], 400)   # single use
        self.assertEqual(call("POST", "/login", {"email": em, "password": "Sup3rsecret99"})[0], 401)
        self.assertEqual(call("POST", "/login", {"email": em, "password": "NewPass12345"})[0], 200)

    def test_passenger_and_shop_owner_do_not_get_passenger_counts(self):
        for who in (PAX, SHOP):
            code, fl = call("GET", "/flights", token=login(who)); rows = fl if isinstance(fl, list) else fl.get("flights", [])
            self.assertTrue(rows); self.assertTrue(all("passengers" not in r for r in rows))
        code, fl = call("GET", "/flights", token=login(ADMIN)); rows = fl if isinstance(fl, list) else fl.get("flights", [])
        self.assertTrue(any(r.get("passengers", 0) > 0 for r in rows))

    def test_passenger_assistance_requests_are_own_only_and_unassignable(self):
        tp, ta = login(PAX), login(ADMIN)
        code, r = call("POST", "/api/records/accessibility", {"pax": "Pax " + RUN, "flight": "AI-101", "need": "Wheelchair", "where": "T3 check-in", "status": "Done", "staff": "Me", "eta": 1}, token=tp)
        self.assertEqual(code, 201); self.assertEqual((r["status"], "staff" in r), ("Open", False))
        other = call("POST", "/api/records/accessibility", {"pax": "Desk " + RUN, "flight": "AI-102", "need": "Wheelchair", "where": "T3", "status": "Open"}, token=ta)[1]
        mine = call("GET", "/api/records/accessibility", token=tp)[1]["records"]
        self.assertTrue(any(x["id"] == r["id"] for x in mine)); self.assertFalse(any(x["id"] == other["id"] for x in mine))   # own only
        call("DELETE", "/api/records/accessibility/" + other["id"], token=ta)
        self.assertTrue(any(x["id"] == r["id"] for x in call("GET", "/api/records/accessibility", token=ta)[1]["records"]))
        self.assertEqual(call("PUT", "/api/records/accessibility/" + r["id"], {"status": "Done"}, token=tp)[0], 403)
        call("DELETE", "/api/records/accessibility/" + r["id"], token=ta)

    def test_passenger_bags_are_own_only_and_start_checked_in(self):
        tp, ta = login(PAX), login(ADMIN)
        code, b = call("POST", "/api/records/baggage", {"tag": "99" + RUN[-6:].replace("-", "0"), "flight": "AI-101", "passenger": "Me", "status": "Delivered", "belt": "9"}, token=tp)
        self.assertEqual(code, 201); self.assertEqual((b["status"], "belt" in b), ("Checked in", False))
        admin_bag = call("POST", "/api/records/baggage", {"tag": "1", "flight": "AI-102", "passenger": "X", "status": "Loaded"}, token=ta)[1]
        mine = call("GET", "/api/records/baggage", token=tp)[1]["records"]
        self.assertTrue(any(x["id"] == b["id"] for x in mine)); self.assertFalse(any(x["id"] == admin_bag["id"] for x in mine))
        self.assertEqual(call("PUT", "/api/records/baggage/" + b["id"], {"status": "Delivered"}, token=tp)[0], 403)
        for x in (b, admin_bag): call("DELETE", "/api/records/baggage/" + x["id"], token=ta)

    def test_shop_orders_stock_ownership_and_totals(self):
        ts, tp, ta = login(SHOP), login(PAX), login(ADMIN)
        mine = [x for x in call("GET", "/api/records/stores", token=ts)[1]["records"] if x.get("ownerId")]
        if mine: shop = mine[0]
        else:
            code, shop = call("POST", "/api/records/stores", {"name": "Test Cafe " + RUN, "category": "F&B", "terminal": "T1", "status": "Open"}, token=ts); self.assertEqual(code, 201)
        self.assertEqual(call("POST", "/api/records/stores", {"name": "Second"}, token=ts)[0], 409)          # one shop per account
        code, prod = call("POST", "/api/records/products", {"name": "Masala Chai " + RUN, "price": 40, "stock": 3, "available": "Yes"}, token=ts); self.assertEqual(code, 201)
        # a passenger cannot create products or edit shops
        self.assertEqual(call("POST", "/api/records/products", {"name": "x", "price": 1}, token=tp)[0], 403)
        self.assertEqual(call("PUT", "/api/records/stores/" + shop["id"], {"status": "Closed"}, token=tp)[0], 403)
        # order: total comes from stored price, stock is reserved, delivery needs a gate
        body = {"shopId": shop["id"], "items": [{"id": prod["id"], "qty": 2, "price": 1}], "deliver": "Gate", "terminal": "T1", "gate": "B12"}
        self.assertEqual(call("POST", "/api/records/orders", {**body, "gate": ""}, token=tp)[0], 400)
        code, o = call("POST", "/api/records/orders", body, token=tp); self.assertEqual(code, 201); self.assertEqual((o["total"], o["status"], o["gate"]), (80, "New", "B12"))
        self.assertEqual(call("POST", "/api/records/orders", body, token=tp)[0], 409)                         # only 1 left
        self.assertTrue(any(x["id"] == o["id"] for x in call("GET", "/api/records/orders", token=ts)[1]["records"]))   # shop owner sees it
        self.assertTrue(any(x["id"] == o["id"] for x in call("GET", "/api/records/orders", token=tp)[1]["records"]))
        self.assertEqual(call("PUT", "/api/records/orders/" + o["id"], {"status": "Accepted"}, token=tp)[0], 403)
        self.assertEqual(call("PUT", "/api/records/orders/" + o["id"], {"status": "Accepted"}, token=ts)[0], 200)
        self.assertEqual(call("PUT", "/api/records/orders/" + o["id"], {"status": "Cancelled"}, token=tp)[0], 403)   # too late for the passenger
        self.assertEqual(call("PUT", "/api/records/orders/" + o["id"], {"status": "Cancelled"}, token=ts)[0], 200)
        stock = [x for x in call("GET", "/api/records/products", token=ts)[1]["records"] if x["id"] == prod["id"]][0]["stock"]
        self.assertEqual(stock, 3)                                                                              # cancelling returned the stock
        call("DELETE", "/api/records/products/" + prod["id"], token=ts)
        if not mine: call("DELETE", "/api/records/stores/" + shop["id"], token=ts)

    def test_owner_can_switch_airport_and_data_follows(self):
        self.assertEqual(call("POST", "/api/auth/switch-airport", {"airport": "BOM"}, token=login(ADMIN))[0], 403)
        self.assertEqual(call("POST", "/api/auth/switch-airport", {"airport": "BOM"})[0], 401)
        t = login(OWNER)
        self.assertEqual(call("POST", "/api/auth/switch-airport", {"airport": "ZZZ"}, token=t)[0], 404)
        code, js = call("POST", "/api/auth/switch-airport", {"airport": "SXR"}, token=t)
        self.assertEqual(code, 200); c = claims(js["token"]); self.assertEqual((c["airport"], c["role"]), ("SXR", "SUPER_ADMIN"))
        code, fl = call("GET", "/flights", token=js["token"]); rows = fl if isinstance(fl, list) else fl.get("flights", [])
        self.assertTrue(rows and all(r.get("origin") == "SXR" or r.get("destination") == "SXR" for r in rows[:20]), rows[:2])

    def test_team_management_is_admin_only_and_tenant_scoped(self):
        self.assertEqual(call("GET", "/api/team")[0], 401)
        self.assertEqual(call("GET", "/api/team", token=login(PAX))[0], 403)
        self.assertEqual(call("POST", "/api/team", {"name": "Nope Nope", "email": f"n{RUN}@example.com", "password": "Sup3rsecret99", "role": "PILOT", "org": "AI"}, token=login(STAFF))[0], 403)
        em = f"cap{RUN.lower()}@example.com"; t = login(ADMIN)
        self.assertEqual(call("POST", "/api/team", {"name": "Capt Test", "email": em, "password": "Sup3rsecret99", "role": "SUPER_ADMIN"}, token=t)[0], 400)   # cannot mint admins
        self.assertEqual(call("POST", "/api/team", {"name": "Capt Test", "email": em, "password": "Sup3rsecret99", "role": "PILOT"}, token=t)[0], 400)         # needs airline
        self.assertEqual(call("POST", "/api/team", {"name": "Capt Test", "email": em, "password": "Sup3rsecret99", "role": "PILOT", "org": "AI"}, token=t)[0], 201)
        code, js = call("GET", "/api/team", token=t); mine = [m for m in js["team"] if m["email"] == em]
        self.assertEqual(len(mine), 1)
        self.assertNotIn(em, [m["email"] for m in call("GET", "/api/team", token=login(BOM_ADMIN))[1]["team"]])
        self.assertEqual(call("DELETE", "/api/team/" + mine[0]["id"], token=login(BOM_ADMIN))[0], 404)       # other airport cannot remove
        self.assertEqual(call("DELETE", "/api/team/" + mine[0]["id"], token=t)[0], 200)


if __name__ == "__main__":
    try: call("GET", "/health")
    except Exception as e: sys.exit(f"Backend not reachable at {BASE}: {e}")
    unittest.main(verbosity=2)
