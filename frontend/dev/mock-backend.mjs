/**
 * Minimal stand-in for the C++ backend, so the frontend can be developed and tested
 * without building Drogon/Postgres/Redis.   Run:  npm run mock-api   (port 8080)
 *
 * It mirrors the REAL contract from src/controllers, including its quirks:
 *   POST /login   -> 200 {token}  |  200 {error}   (wrong password is NOT a 401)
 *   GET  /flights -> array of {flight_number,destination,status,gate,id,origin,...}, tenant via X-Tenant-ID
 *   GET  /health  -> {status:"healthy"}
 * MOCK_LOGIN_STUB=1 reproduces today's real backend, where AuthService::login() returns "".
 * This is a development aid only — it is NOT the real server.
 */
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT || 8080);
const SECRET = process.env.JWT_SECRET || "dev-only-secret";
const STUB = process.env.MOCK_LOGIN_STUB === "1";

const USERS = {
  "admin@del.aerobase.in":    { pw: "DEL@Admin2024", id: "u-001", name: "Arjun Sharma", role: "AIRPORT_ADMIN",    airport: "DEL", airport_name: "Delhi Indira Gandhi Intl" },
  "security@del.aerobase.in": { pw: "Sec@2024",      id: "u-002", name: "Ravi Menon",   role: "SECURITY_OFFICER", airport: "DEL", airport_name: "Delhi Indira Gandhi Intl" },
};

const FLIGHTS = {
  DEL: [
    { id: "f1", flight_number: "6E-2341", origin: "DEL", destination: "BLR", status: "Boarding",  gate: "B3", departure_time: "2026-11-09T11:00:00", arrival_time: "2026-11-09T13:15:00" },
    { id: "f2", flight_number: "AI-101",  origin: "DEL", destination: "BOM", status: "Delayed",   gate: "A1", departure_time: "2026-11-09T10:30:00", arrival_time: "2026-11-09T12:40:00" },
    { id: "f3", flight_number: "EK-511",  origin: "DEL", destination: "DXB", status: "scheduled", gate: "E2", departure_time: "2026-11-09T16:00:00", arrival_time: "2026-11-09T18:30:00" },
  ],
  BOM: [{ id: "f9", flight_number: "UK-955", origin: "BOM", destination: "DEL", status: "Scheduled", gate: "C1", departure_time: "2026-11-09T09:00:00", arrival_time: "2026-11-09T11:10:00" }],
};

const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function signJwt(claims) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ iss: "aerobase", ...claims });
  const sig = crypto.createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

let lastFlightsRequest = null;
const server = http.createServer((req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Tenant-ID,X-Request-ID",
  };
  const send = (code, body) => { res.writeHead(code, { "Content-Type": "application/json", ...cors }); res.end(JSON.stringify(body)); };
  if (req.method === "OPTIONS") { res.writeHead(200, cors); return res.end(); }
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/health") return send(200, { status: "healthy" });
  if (url.pathname === "/__last-flights-request") return send(200, lastFlightsRequest ?? {});

  if (url.pathname === "/flights" && req.method === "GET") {
    lastFlightsRequest = { authorization: req.headers.authorization ?? null, tenant: req.headers["x-tenant-id"] ?? null };
    return send(200, FLIGHTS[req.headers["x-tenant-id"] || "DEL"] ?? []);
  }

  if (url.pathname === "/login" && req.method === "POST") {
    let raw = ""; req.on("data", (c) => (raw += c));
    req.on("end", () => {
      let body; try { body = JSON.parse(raw); } catch { return send(400, { error: "Invalid JSON" }); }
      if (STUB) return send(200, { token: "" });
      const u = USERS[String(body.email ?? "").toLowerCase()];
      if (!u || u.pw !== body.password) return send(200, { error: "Invalid credentials" });
      return send(200, { token: signJwt({ user_id: u.id, tenant_id: "tenant-" + u.airport, airport: u.airport, airport_name: u.airport_name, name: u.name, role: u.role, exp: Math.floor(Date.now() / 1000) + 3600 }) });
    });
    return;
  }
  send(404, { error: "Not found" });
});
server.listen(PORT, () => console.log(`mock backend on http://localhost:${PORT}${STUB ? "  (login stub mode)" : ""}`));
