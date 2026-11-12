#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <regex>
#include "../config/DatabaseManager.h"
#include "../services/JwtService.h"
#include "../services/AuditWriter.h"

using namespace drogon;

// PATCH /flights/{id}  {status?, gate?, issue?, delay_minutes?}
// Airport admins and ground staff update live operations; every change is audited.
class FlightOpsController : public HttpController<FlightOpsController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(FlightOpsController::update, "/flights/{1}", Patch);
        ADD_METHOD_TO(FlightOpsController::create, "/api/flights", Post);
    METHOD_LIST_END

    static void reply(const std::function<void(const HttpResponsePtr&)>& cb, const char* m, HttpStatusCode c, const char* key = "error") {
        Json::Value e; e[key] = m; auto r = HttpResponse::newHttpJsonResponse(e); r->setStatusCode(c); cb(r);
    }


    // POST /api/flights  - schedule a flight for the caller's airport (tenant always comes from the token).
    void create(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            const std::string h = req->getHeader("Authorization");
            if (h.size() <= 7) return reply(cb, "Unauthorized", k401Unauthorized);
            auto d = JwtService::verifyToken(h.substr(7));
            const std::string role = d.get_payload_claim("role").as_string();
            if (role != "AIRPORT_ADMIN" && role != "SUPER_ADMIN" && role != "GROUND_STAFF") return reply(cb, "Forbidden", k403Forbidden);
            const std::string tenant = d.get_payload_claim("tenant_id").as_string();
            auto j = req->getJsonObject(); if (!j || !j->isObject()) return reply(cb, "JSON body required", k400BadRequest);
            auto str = [&](const char* k) { return (*j)[k].asString(); };
            const std::string num = str("flight_number"), org = str("origin"), dst = str("destination"), dep = str("departure_time"), gate = str("gate"),
                terminal = str("terminal"), airline = str("airline"), code = str("airline_code"), craft = str("aircraft");
            std::string arr = str("arrival_time");
            static const std::regex fn("^[A-Z0-9]{2}-[0-9]{1,4}[A-Z]?$"), ts("^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?$"), ap("^[A-Za-z]{3,4}$"), gt("^[A-Za-z0-9-]{0,10}$");
            if (!std::regex_match(num, fn)) return reply(cb, "flight_number must look like AI-101", k400BadRequest);
            if (!std::regex_match(org, ap) || !std::regex_match(dst, ap)) return reply(cb, "origin and destination must be airport codes", k400BadRequest);
            if (org == dst) return reply(cb, "origin and destination must differ", k400BadRequest);
            if (!std::regex_match(dep, ts) || (!arr.empty() && !std::regex_match(arr, ts))) return reply(cb, "times must be YYYY-MM-DD HH:MM", k400BadRequest);
            if (!std::regex_match(gate, gt) || terminal.size() > 10 || airline.size() > 100 || code.size() > 8 || craft.size() > 30) return reply(cb, "Invalid field length", k400BadRequest);
            int pax = (*j).isMember("passengers") ? (*j)["passengers"].asInt() : 0;
            if (pax < 0 || pax > 900) return reply(cb, "passengers must be 0-900", k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params(
                "INSERT INTO flights (id, tenant_id, flight_number, origin, destination, departure_time, arrival_time, gate, status, airline, airline_code, aircraft, terminal, passengers) "
                "VALUES (gen_random_uuid(), $1::uuid, $2, upper($3), upper($4), $5::timestamp, COALESCE(NULLIF($6,'')::timestamp, $5::timestamp + INTERVAL '2 hours'), NULLIF($7,''), 'Scheduled', NULLIF($8,''), NULLIF(upper($9),''), NULLIF($10,''), NULLIF($11,''), $12) "
                "ON CONFLICT (tenant_id, flight_number, departure_time) DO NOTHING RETURNING id::text",
                tenant, num, org, dst, dep, arr, gate, airline, code, craft, terminal, pax);
            t.commit();
            if (r.empty()) return reply(cb, "That flight is already scheduled at that time", k409Conflict);
            Json::Value det; det["flight_number"] = num; AuditWriter::record(tenant, d.get_payload_claim("user_id").as_string(), "FLIGHT_CREATED", "flight", det, req->peerAddr().toIp());
            Json::Value out; out["id"] = r[0][0].c_str(); auto resp = HttpResponse::newHttpJsonResponse(out); resp->setStatusCode(k201Created); cb(resp);
        } catch (const std::exception&) { reply(cb, "Internal server error", k500InternalServerError); }
    }

    void update(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb, std::string id) {
        try {
            const std::string h = req->getHeader("Authorization");
            if (h.size() <= 7) return reply(cb, "Unauthorized", k401Unauthorized);
            auto d = JwtService::verifyToken(h.substr(7));
            const std::string role = d.get_payload_claim("role").as_string();
            if (role != "AIRPORT_ADMIN" && role != "SUPER_ADMIN" && role != "GROUND_STAFF") return reply(cb, "Forbidden", k403Forbidden);
            const std::string tenant = d.get_payload_claim("tenant_id").as_string();
            static const std::regex uuid("^[0-9a-fA-F-]{36}$");
            if (!std::regex_match(id, uuid)) return reply(cb, "Invalid flight id", k400BadRequest);
            auto j = req->getJsonObject(); if (!j || !j->isObject()) return reply(cb, "JSON body required", k400BadRequest);

            static const char* STATUSES[] = {"Scheduled", "Boarding", "Departed", "Landed", "Delayed", "Cancelled"};
            std::string status = (*j)["status"].asString();
            if (!status.empty()) { bool ok = false; for (auto s : STATUSES) if (status == s) ok = true; if (!ok) return reply(cb, "Unknown status", k400BadRequest); }
            const std::string gate = (*j)["gate"].asString(), issue = (*j)["issue"].asString();
            static const std::regex gateRe("^[A-Za-z0-9-]{0,10}$");
            if (!std::regex_match(gate, gateRe) || issue.size() > 300) return reply(cb, "Invalid gate or issue", k400BadRequest);
            const bool hasDelay = j->isMember("delay_minutes");
            int delay = hasDelay ? (*j)["delay_minutes"].asInt() : 0;
            if (delay < 0 || delay > 1440) return reply(cb, "delay_minutes out of range", k400BadRequest);

            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params(
                "UPDATE flights SET status = COALESCE(NULLIF($3,''), status), gate = COALESCE(NULLIF($4,''), gate), "
                "issue = CASE WHEN $5::boolean THEN $6 ELSE issue END, delay_minutes = CASE WHEN $7::boolean THEN $8 ELSE delay_minutes END, "
                "updated_at = CURRENT_TIMESTAMP WHERE id = $1::uuid AND tenant_id = $2::uuid RETURNING flight_number",
                id, tenant, status, gate, j->isMember("issue"), issue, hasDelay, delay);
            t.commit();
            if (r.empty()) return reply(cb, "Flight not found", k404NotFound);
            Json::Value det = *j; det["flight_number"] = r[0][0].c_str();
            AuditWriter::record(tenant, d.get_payload_claim("user_id").as_string(), "FLIGHT_UPDATED", "flight", det, req->peerAddr().toIp());
            reply(cb, "updated", k200OK, "result");
        } catch (const std::exception&) { reply(cb, "Internal server error", k500InternalServerError); }
    }
};
