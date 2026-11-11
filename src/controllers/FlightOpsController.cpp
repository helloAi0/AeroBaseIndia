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
    METHOD_LIST_END

    static void reply(const std::function<void(const HttpResponsePtr&)>& cb, const char* m, HttpStatusCode c, const char* key = "error") {
        Json::Value e; e[key] = m; auto r = HttpResponse::newHttpJsonResponse(e); r->setStatusCode(c); cb(r);
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
