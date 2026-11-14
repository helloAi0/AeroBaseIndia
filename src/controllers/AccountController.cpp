#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <openssl/rand.h>
#include <regex>
#include <cstdlib>
#include "../config/DatabaseManager.h"
#include "../services/PasswordService.h"
#include "../services/AuditWriter.h"
#include "../notifications/EmailService.h"
#include "../middleware/JwtIdentity.h"
#include "../services/JwtService.h"

using namespace drogon;

// Account lifecycle: public sign-up (passenger / shop owner), forgot + reset password, the airport list for the
// sign-up form, and admin-created team accounts (ground staff, security, airline ops, pilots).
class AccountController : public HttpController<AccountController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AccountController::airports, "/api/public/airports", Get);
        ADD_METHOD_TO(AccountController::airlines, "/api/public/airlines", Get);
        ADD_METHOD_TO(AccountController::registerUser, "/api/auth/register", Post);
        ADD_METHOD_TO(AccountController::forgot, "/api/auth/forgot", Post);
        ADD_METHOD_TO(AccountController::reset, "/api/auth/reset", Post);
        ADD_METHOD_TO(AccountController::switchAirport, "/api/auth/switch-airport", Post);
        ADD_METHOD_TO(AccountController::listTeam, "/api/team", Get);
        ADD_METHOD_TO(AccountController::createTeam, "/api/team", Post);
        ADD_METHOD_TO(AccountController::removeTeam, "/api/team/{1}", Delete);
        ADD_METHOD_TO(AccountController::securityTeam, "/api/team/security", Get);
        ADD_METHOD_TO(AccountController::linkCrew, "/api/crew/link", Post);
    METHOD_LIST_END

    using Cb = std::function<void(const HttpResponsePtr&)>;

private:
    static void send(Cb& cb, HttpStatusCode c, const Json::Value& v) { auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r); }
    static void fail(Cb& cb, HttpStatusCode c, const char* m) { Json::Value e; e["error"] = m; send(cb, c, e); }
    static std::string env(const char* k, const char* d = "") { const char* v = std::getenv(k); return (v && *v) ? v : d; }
    static bool validEmail(const std::string& e) {
        static const std::regex re(R"(^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$)");
        return e.size() <= 254 && std::regex_match(e, re);
    }
    // 10+ chars with a letter and a digit.
    static bool strongPassword(const std::string& p) {
        if (p.size() < 10 || p.size() > 200) return false;
        bool l = false, d = false; for (unsigned char c : p) { if (std::isalpha(c)) l = true; if (std::isdigit(c)) d = true; }
        return l && d;
    }
    static std::string str(const Json::Value& j, const char* k, size_t max) {
        if (!j.isObject() || !j[k].isString()) return "";
        std::string s = j[k].asString(); if (s.size() > max) s.resize(max);
        return s;
    }
    static std::string randomToken() {
        unsigned char b[32]; RAND_bytes(b, sizeof b);
        return PasswordService::toHex(std::vector<unsigned char>(b, b + sizeof b));
    }

public:
    void airports(const HttpRequestPtr&, Cb&& cb) {
        try {
            auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
            auto rows = t.exec("SELECT airport_code, airport_name FROM tenants ORDER BY airport_code");
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) { Json::Value o; o["code"] = r[0].c_str(); o["name"] = r[1].c_str(); arr.append(o); }
            Json::Value out; out["airports"] = arr; send(cb, k200OK, out);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Internal server error"); }
    }

    // GET /api/public/airlines?airport=BOM: the airlines operating at an airport (public schedule information; lets an airline-ops user pick their airline).
    void airlines(const HttpRequestPtr& req, Cb&& cb) {
        const std::string airport = req->getParameter("airport");
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::read_transaction t(conn);
            auto rows = t.exec_params("SELECT airline_code, airline FROM (SELECT DISTINCT ON (f.airline_code) f.airline_code, f.airline FROM flights f JOIN tenants te ON te.id = f.tenant_id WHERE te.airport_code = upper($1) AND f.airline_code IS NOT NULL ORDER BY f.airline_code, f.airline) x ORDER BY airline", airport);
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) { Json::Value o; o["code"] = r[0].c_str(); o["name"] = r[1].c_str(); arr.append(o); }
            Json::Value out; out["airlines"] = arr; send(cb, k200OK, out);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Internal server error"); }
    }

    // POST /api/auth/register {name,email,password,airport,account_type: PASSENGER|RETAILER, shop?}
    void registerUser(const HttpRequestPtr& req, Cb&& cb) {
        const auto j = req->getJsonObject();
        if (!j || !j->isObject()) return fail(cb, k400BadRequest, "JSON body required");
        const std::string name = str(*j, "name", 120), email = str(*j, "email", 254), pw = str(*j, "password", 200),
                          airport = str(*j, "airport", 8), type = str(*j, "account_type", 12), shop = str(*j, "shop", 60);
        if (name.size() < 2) return fail(cb, k400BadRequest, "Please enter your full name");
        if (!validEmail(email)) return fail(cb, k400BadRequest, "Please enter a valid email address");
        if (!strongPassword(pw)) return fail(cb, k400BadRequest, "Password must be at least 10 characters with a letter and a number");
        if (type == "PILOT") return registerPilot(req, cb, name, email, pw, str(*j, "crew_ref", 40), str(*j, "license", 40));
        const std::string role = type == "RETAILER" ? "RETAILER" : "PASSENGER";
        if (role == "RETAILER" && shop.size() < 2) return fail(cb, k400BadRequest, "Please enter your shop or brand name");
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            auto t = tx.exec_params("SELECT id FROM tenants WHERE airport_code = upper($1)", airport);
            if (t.empty()) return fail(cb, k400BadRequest, "Please choose an airport");
            auto ex = tx.exec_params("SELECT 1 FROM users WHERE lower(email) = lower($1)", email);
            if (!ex.empty()) return fail(cb, k409Conflict, "An account with this email already exists. Try signing in or reset your password.");
            tx.exec_params("INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, org_code) VALUES (gen_random_uuid(), $1, $2, lower($3), $4, $5, NULLIF($6,''))",
                           t[0][0].c_str(), name, email, PasswordService::hashPassword(pw), role, role == "RETAILER" ? shop : "");
            tx.commit();
            Json::Value d; d["email"] = email; d["role"] = role;
            AuditWriter::record(t[0][0].c_str(), "", "SIGNUP", "user", d, req->getPeerAddr().toIp());
            Json::Value ok; ok["result"] = "ok"; ok["message"] = "Account created. You can sign in now.";
            send(cb, k201Created, ok);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Could not create the account"); }
    }

    // Pilots and crew cannot self-assign an airline: they present the reference ID and licence number their airline issued, plus their name.
    void registerPilot(const HttpRequestPtr& req, Cb& cb, const std::string& name, const std::string& email, const std::string& pw, const std::string& ref, const std::string& license) {
        static const char* kNoMatch = "We could not verify those details. Check your name, licence number and crew reference ID with your airline's operations team.";
        if (ref.size() < 6 || license.size() < 4) return fail(cb, k400BadRequest, "Enter the crew reference ID and licence number your airline gave you");
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            auto c = tx.exec_params("SELECT id::text, tenant_id::text, COALESCE(data->>'airline','') FROM app_records WHERE collection='crew' AND upper(data->>'refId') = upper($1) AND upper(data->>'license') = upper($2) "
                                    "AND lower(btrim(data->>'name')) = lower(btrim($3)) AND COALESCE(data->>'status','Unclaimed') = 'Unclaimed' FOR UPDATE", ref, license, name);
            if (c.empty()) return fail(cb, k400BadRequest, kNoMatch);
            if (!tx.exec_params("SELECT 1 FROM users WHERE lower(email) = lower($1)", email).empty()) return fail(cb, k409Conflict, "An account with this email already exists. Try signing in or reset your password.");
            auto u = tx.exec_params("INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, org_code) VALUES (gen_random_uuid(), $1::uuid, $2, lower($3), $4, 'PILOT', NULLIF($5,'')) RETURNING id::text",
                                    c[0][1].c_str(), name, email, PasswordService::hashPassword(pw), c[0][2].c_str());
            tx.exec_params("UPDATE app_records SET data = data || jsonb_build_object('status','Active','claimedBy',$2::text,'claimedName',$3::text) WHERE id = $1::uuid", c[0][0].c_str(), u[0][0].c_str(), name);
            tx.commit();
            Json::Value d; d["email"] = email; d["role"] = "PILOT"; AuditWriter::record(c[0][1].c_str(), u[0][0].c_str(), "SIGNUP", "user", d, req->getPeerAddr().toIp());
            Json::Value ok; ok["result"] = "ok"; ok["message"] = "Crew account verified. You can sign in now."; send(cb, k201Created, ok);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Could not create the account"); }
    }

    // POST /api/crew/link {crew_ref, license}: a pilot who changed airline (or airport) enters the new reference ID; everything follows it.
    void linkCrew(const HttpRequestPtr& req, Cb&& cb) {
        jwtid::Identity id; if (!jwtid::identify(req, id)) return cb(jwtid::error(k401Unauthorized, "Unauthorized"));
        if (id.role != "PILOT") return cb(jwtid::error(k403Forbidden, "Only crew accounts can link a crew reference ID"));
        const auto j = req->getJsonObject(); const std::string ref = j ? str(*j, "crew_ref", 40) : "", license = j ? str(*j, "license", 40) : "";
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            auto me = tx.exec_params("SELECT full_name, email FROM users WHERE id = $1::uuid", id.user); if (me.empty()) return fail(cb, k404NotFound, "Account not found");
            auto c = tx.exec_params("SELECT id::text, tenant_id::text, COALESCE(data->>'airline','') FROM app_records WHERE collection='crew' AND upper(data->>'refId') = upper($1) AND upper(data->>'license') = upper($2) "
                                    "AND lower(btrim(data->>'name')) = lower(btrim($3)) AND COALESCE(data->>'status','Unclaimed') = 'Unclaimed' FOR UPDATE", ref, license, me[0][0].c_str());
            if (c.empty()) return fail(cb, k400BadRequest, "We could not verify those details. Check the reference ID and licence number with your new airline.");
            tx.exec_params("UPDATE app_records SET data = data || '{\"status\":\"Left\"}'::jsonb WHERE collection='crew' AND data->>'claimedBy' = $1", id.user);
            tx.exec_params("UPDATE users SET tenant_id = $2::uuid, org_code = NULLIF($3,'') WHERE id = $1::uuid", id.user, c[0][1].c_str(), c[0][2].c_str());
            tx.exec_params("UPDATE app_records SET data = data || jsonb_build_object('status','Active','claimedBy',$2::text,'claimedName',$3::text) WHERE id = $1::uuid", c[0][0].c_str(), id.user, me[0][0].c_str());
            auto te = tx.exec_params("SELECT airport_code, airport_name FROM tenants WHERE id = $1::uuid", c[0][1].c_str());
            tx.commit();
            Json::Value o;
            o["token"] = JwtService::generateToken({{"user_id", id.user}, {"tenant_id", c[0][1].c_str()}, {"role", "PILOT"}, {"name", me[0][0].c_str()}, {"email", me[0][1].c_str()},
                                                    {"airport", te[0][0].c_str()}, {"airport_name", te[0][1].c_str()}, {"org", c[0][2].c_str()}});
            o["airport"] = te[0][0].c_str(); o["airport_name"] = te[0][1].c_str();
            AuditWriter::record(c[0][1].c_str(), id.user, "CREW_LINKED", "user", Json::Value(), req->getPeerAddr().toIp());
            send(cb, k200OK, o);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Could not link the reference ID"); }
    }

    // GET /api/team/security: the security officers at this airport with their reference IDs (security head and airport director only).
    void securityTeam(const HttpRequestPtr& req, Cb&& cb) {
        jwtid::Identity id; if (!jwtid::identify(req, id)) return cb(jwtid::error(k401Unauthorized, "Unauthorized"));
        const bool head = id.role == "SECURITY_OFFICER" && id.org == "HEAD";
        if (!head && id.role != "AIRPORT_ADMIN" && id.role != "SUPER_ADMIN") return cb(jwtid::error(k403Forbidden, "Forbidden"));
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::read_transaction t(conn);
            auto rows = t.exec_params("SELECT id::text, full_name, email, COALESCE(org_code,''), 'SEC-' || upper(substr(replace(id::text,'-',''),1,6)) FROM users WHERE tenant_id = $1::uuid AND role = 'SECURITY_OFFICER' ORDER BY (org_code = 'HEAD') DESC NULLS LAST, full_name", id.tenant);
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) { Json::Value o; o["id"] = r[0].c_str(); o["name"] = r[1].c_str(); o["email"] = r[2].c_str(); o["head"] = std::string(r[3].c_str()) == "HEAD"; o["ref"] = r[4].c_str(); arr.append(o); }
            Json::Value out; out["officers"] = arr; send(cb, k200OK, out);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Internal server error"); }
    }

    // POST /api/auth/forgot {email}: always answers the same (no account enumeration).
    void forgot(const HttpRequestPtr& req, Cb&& cb) {
        const auto j = req->getJsonObject();
        const std::string email = j ? str(*j, "email", 254) : "";
        if (!validEmail(email)) return fail(cb, k400BadRequest, "Please enter a valid email address");
        Json::Value out; out["result"] = "ok";
        out["message"] = "If an account exists for that email, a reset link has been sent. It is valid for 30 minutes.";
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            auto u = tx.exec_params("SELECT id, tenant_id, full_name FROM users WHERE lower(email) = lower($1)", email);
            if (!u.empty()) {
                tx.exec_params("DELETE FROM password_resets WHERE user_id = $1 AND (used_at IS NOT NULL OR expires_at < now())", u[0][0].c_str());
                const std::string token = randomToken();
                tx.exec_params("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '30 minutes')",
                               u[0][0].c_str(), PasswordService::sha256Hex(token));
                tx.commit();
                const std::string base = env("PUBLIC_APP_URL", req->getHeader("Origin").empty() ? "http://localhost:3000" : req->getHeader("Origin").c_str());
                const std::string link = base + "/#/reset?token=" + token;
                EmailPayload p; p.to = email; p.tenantId = u[0][1].c_str(); p.type = "ALERT"; p.subject = "Reset your AeroBase India password";
                p.body = std::string("Hello ") + u[0][2].c_str() + ",\n\nUse this link to choose a new password (valid for 30 minutes):\n" + link +
                         "\n\nIf you did not ask for this, ignore this email; your password has not changed.";
                EmailService::send(p);
                // Local/dev convenience when no email provider is configured: hand the link back to the page.
                if (env("AUTH_DEV_RETURN_RESET_LINK") == "true") out["reset_link"] = link;
                AuditWriter::record(u[0][1].c_str(), u[0][0].c_str(), "PASSWORD_RESET_REQUESTED", "user", Json::Value(), req->getPeerAddr().toIp());
            }
        } catch (const std::exception&) { /* same answer either way */ }
        send(cb, k200OK, out);
    }

    // POST /api/auth/reset {token,password}
    void reset(const HttpRequestPtr& req, Cb&& cb) {
        const auto j = req->getJsonObject();
        if (!j) return fail(cb, k400BadRequest, "JSON body required");
        const std::string token = str(*j, "token", 128), pw = str(*j, "password", 200);
        if (token.size() < 32) return fail(cb, k400BadRequest, "This reset link is invalid or has expired");
        if (!strongPassword(pw)) return fail(cb, k400BadRequest, "Password must be at least 10 characters with a letter and a number");
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            auto r = tx.exec_params("SELECT id, user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE", PasswordService::sha256Hex(token));
            if (r.empty()) return fail(cb, k400BadRequest, "This reset link is invalid or has expired");
            tx.exec_params("UPDATE users SET password_hash = $1 WHERE id = $2", PasswordService::hashPassword(pw), r[0][1].c_str());
            tx.exec_params("UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL", r[0][1].c_str());
            tx.commit();
            Json::Value ok; ok["result"] = "ok"; ok["message"] = "Password updated. You can sign in now.";
            send(cb, k200OK, ok);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Could not reset the password"); }
    }

    // POST /api/auth/switch-airport {airport}: platform owner (SUPER_ADMIN) only. Re-issues the token for another airport,
    // so the whole API really serves that airport's data (client headers are never trusted for this).
    void switchAirport(const HttpRequestPtr& req, Cb&& cb) {
        std::string role, user;
        try {
            const std::string h = req->getHeader("Authorization");
            if (h.size() <= 7 || h.rfind("Bearer ", 0) != 0) return cb(jwtid::error(k401Unauthorized, "Unauthorized"));
            auto d = JwtService::verifyToken(h.substr(7));
            role = d.get_payload_claim("role").as_string(); user = d.get_payload_claim("user_id").as_string();
        } catch (const std::exception&) { return cb(jwtid::error(k401Unauthorized, "Unauthorized")); }
        if (role != "SUPER_ADMIN") return cb(jwtid::error(k403Forbidden, "Only the platform owner can switch airports"));
        const auto j = req->getJsonObject();
        const std::string airport = j ? str(*j, "airport", 8) : "";
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::read_transaction t(conn);
            auto r = t.exec_params("SELECT u.full_name, u.email, COALESCE(u.org_code,''), te.id, te.airport_code, te.airport_name FROM users u, tenants te WHERE u.id = $1 AND te.airport_code = upper($2)", user, airport);
            if (r.empty()) return fail(cb, k404NotFound, "Unknown airport");
            Json::Value o;
            o["token"] = JwtService::generateToken({{"user_id", user}, {"tenant_id", r[0][3].c_str()}, {"role", role}, {"name", r[0][0].c_str()}, {"email", r[0][1].c_str()},
                                                    {"airport", r[0][4].c_str()}, {"airport_name", r[0][5].c_str()}, {"org", r[0][2].c_str()}});
            o["airport"] = r[0][4].c_str(); o["airport_name"] = r[0][5].c_str();
            send(cb, k200OK, o);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Internal server error"); }
    }

    // ---- Team accounts (airport admin creates the people who work at their airport) ----
    void listTeam(const HttpRequestPtr& req, Cb&& cb) {
        jwtid::Identity id; if (!jwtid::identify(req, id)) return cb(jwtid::error(k401Unauthorized, "Unauthorized"));
        if (id.role != "AIRPORT_ADMIN" && id.role != "SUPER_ADMIN") return cb(jwtid::error(k403Forbidden, "Forbidden"));
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::read_transaction t(conn);
            auto rows = t.exec_params("SELECT id, full_name, email, role, COALESCE(org_code,''), created_at::text FROM users WHERE tenant_id = $1 ORDER BY role, full_name", id.tenant);
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) { Json::Value o; o["id"] = r[0].c_str(); o["name"] = r[1].c_str(); o["email"] = r[2].c_str(); o["role"] = r[3].c_str(); o["org"] = r[4].c_str(); o["created_at"] = r[5].c_str(); arr.append(o); }
            Json::Value out; out["team"] = arr; send(cb, k200OK, out);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Internal server error"); }
    }

    void createTeam(const HttpRequestPtr& req, Cb&& cb) {
        jwtid::Identity id; if (!jwtid::identify(req, id)) return cb(jwtid::error(k401Unauthorized, "Unauthorized"));
        const bool head = id.role == "SECURITY_OFFICER" && id.org == "HEAD";
        if (id.role != "AIRPORT_ADMIN" && id.role != "SUPER_ADMIN" && !head) return cb(jwtid::error(k403Forbidden, "Forbidden"));
        const auto j = req->getJsonObject();
        if (!j || !j->isObject()) return fail(cb, k400BadRequest, "JSON body required");
        const std::string name = str(*j, "name", 120), email = str(*j, "email", 254), pw = str(*j, "password", 200), role = str(*j, "role", 24), org = str(*j, "org", 60);
        if (head && !(role == "SECURITY_OFFICER" && org.empty())) return cb(jwtid::error(k403Forbidden, "A security head can only add security officers"));
        static const std::set<std::string> allowed{"GROUND_STAFF", "SECURITY_OFFICER", "AIRLINE_OPS", "PILOT", "RETAILER", "PASSENGER"};
        if (!allowed.count(role)) return fail(cb, k400BadRequest, "Unknown role");
        if (name.size() < 2 || !validEmail(email)) return fail(cb, k400BadRequest, "Name and a valid email are required");
        if (!strongPassword(pw)) return fail(cb, k400BadRequest, "Password must be at least 10 characters with a letter and a number");
        if ((role == "AIRLINE_OPS" || role == "PILOT") && org.empty()) return fail(cb, k400BadRequest, "Airline code is required (e.g. 6E, AI)");
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            if (!tx.exec_params("SELECT 1 FROM users WHERE lower(email) = lower($1)", email).empty()) return fail(cb, k409Conflict, "That email already has an account");
            tx.exec_params("INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, org_code) VALUES (gen_random_uuid(), $1, $2, lower($3), $4, $5, NULLIF($6,''))",
                           id.tenant, name, email, PasswordService::hashPassword(pw), role, org);
            tx.commit();
            Json::Value d; d["email"] = email; d["role"] = role;
            AuditWriter::record(id.tenant, id.user, "TEAM_MEMBER_CREATED", "user", d, req->getPeerAddr().toIp());
            Json::Value ok; ok["result"] = "ok"; send(cb, k201Created, ok);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Could not create the account"); }
    }

    void removeTeam(const HttpRequestPtr& req, Cb&& cb, std::string userId) {
        jwtid::Identity id; if (!jwtid::identify(req, id)) return cb(jwtid::error(k401Unauthorized, "Unauthorized"));
        if (id.role != "AIRPORT_ADMIN" && id.role != "SUPER_ADMIN") return cb(jwtid::error(k403Forbidden, "Forbidden"));
        static const std::regex uuid(R"(^[0-9a-fA-F-]{36}$)");
        if (!std::regex_match(userId, uuid)) return fail(cb, k400BadRequest, "Invalid id");
        if (userId == id.user) return fail(cb, k400BadRequest, "You cannot remove your own account");
        try {
            auto conn = DatabaseManager::makeConnection(); pqxx::work tx(conn);
            auto r = tx.exec_params("DELETE FROM users WHERE id = $1 AND tenant_id = $2 AND role NOT IN ('AIRPORT_ADMIN','SUPER_ADMIN')", userId, id.tenant);
            tx.commit();
            if (r.affected_rows() == 0) return fail(cb, k404NotFound, "Team member not found");
            AuditWriter::record(id.tenant, id.user, "TEAM_MEMBER_REMOVED", "user", Json::Value(), req->getPeerAddr().toIp());
            Json::Value ok; ok["result"] = "ok"; send(cb, k200OK, ok);
        } catch (const std::exception&) { fail(cb, k500InternalServerError, "Could not remove the account"); }
    }
};
