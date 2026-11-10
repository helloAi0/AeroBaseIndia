#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <algorithm>
#include "../config/DatabaseManager.h"
#include "../services/JwtService.h"

using namespace drogon;

// GET /audit/logs?limit=50&offset=0&action=LOGIN   (admin only, enforced by RouteGuard)
// AIRPORT_ADMIN sees only their own tenant; SUPER_ADMIN sees all tenants.
class AuditController : public HttpController<AuditController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AuditController::listLogs, "/audit/logs", Get);
    METHOD_LIST_END

    void listLogs(const HttpRequestPtr& req,
                  std::function<void(const HttpResponsePtr&)>&& callback) {
        try {
            auto d = JwtService::verifyToken(req->getHeader("Authorization").substr(7));
            const std::string role   = d.get_payload_claim("role").as_string();
            const std::string tenant = d.get_payload_claim("tenant_id").as_string();

            auto clampInt = [&](const std::string& k, int def, int lo, int hi) {
                try { return std::clamp(std::stoi(req->getParameter(k)), lo, hi); }
                catch (...) { return def; }
            };
            const int limit  = clampInt("limit", 50, 1, 200);
            const int offset = clampInt("offset", 0, 0, 1000000);
            const std::string action = req->getParameter("action");

            auto conn = DatabaseManager::getConnection();
            pqxx::read_transaction txn(*conn);
            const bool all = (role == "SUPER_ADMIN");
            auto rows = txn.exec_params(
                "SELECT a.id::text, COALESCE(a.action,''), COALESCE(a.entity_type,''), "
                "COALESCE(a.entity_id::text,''), COALESCE(a.ip_address,''), "
                "COALESCE(a.new_data::text,'{}'), to_char(a.created_at,'YYYY-MM-DD\"T\"HH24:MI:SS'), "
                "COALESCE(a.tenant_id::text,'') "
                "FROM audit_logs a "
                "WHERE ($1 OR a.tenant_id = NULLIF($2,'')::uuid) AND ($3 = '' OR a.action = $3) "
                "ORDER BY a.created_at DESC LIMIT $4 OFFSET $5",
                all, tenant, action, limit, offset);

            Json::Value out(Json::arrayValue);
            Json::CharReaderBuilder rb;
            for (const auto& r : rows) {
                Json::Value e;
                e["id"] = r[0].c_str(); e["action"] = r[1].c_str();
                e["entity_type"] = r[2].c_str(); e["entity_id"] = r[3].c_str();
                e["ip_address"] = r[4].c_str();
                Json::Value details; std::string errs; std::istringstream is(r[5].c_str());
                if (Json::parseFromStream(rb, is, &details, &errs)) e["details"] = details;
                e["created_at"] = r[6].c_str();
                if (all) e["tenant_id"] = r[7].c_str();
                out.append(e);
            }
            Json::Value resp; resp["count"] = (Json::UInt)out.size();
            resp["limit"] = limit; resp["offset"] = offset; resp["logs"] = out;
            callback(HttpResponse::newHttpJsonResponse(resp));
        } catch (const std::exception&) {
            Json::Value e; e["error"] = "Could not load audit logs";
            auto r = HttpResponse::newHttpJsonResponse(e); r->setStatusCode(k500InternalServerError);
            callback(r);
        }
    }
};
