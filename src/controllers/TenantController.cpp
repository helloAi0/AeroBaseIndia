#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <regex>
#include "../config/DatabaseManager.h"
#include "../services/JwtService.h"
#include "../services/AuditWriter.h"

using namespace drogon;

// SUPER_ADMIN only: list airports with live counts, and onboard a new airport.
//   GET  /api/tenants
//   POST /api/tenants {airport_name, airport_code, plan?}
class TenantController : public HttpController<TenantController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(TenantController::list, "/api/tenants", Get);
        ADD_METHOD_TO(TenantController::create, "/api/tenants", Post);
    METHOD_LIST_END

    static void reply(const std::function<void(const HttpResponsePtr&)>& cb, const Json::Value& v, HttpStatusCode c = k200OK) { auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r); }
    static void fail(const std::function<void(const HttpResponsePtr&)>& cb, const char* m, HttpStatusCode c) { Json::Value e; e["error"] = m; reply(cb, e, c); }
    static bool superAdmin(const HttpRequestPtr& req, std::string& uid, std::string& tenant) {
        auto d = JwtService::verifyToken(req->getHeader("Authorization").substr(7));
        uid = d.get_payload_claim("user_id").as_string(); tenant = d.get_payload_claim("tenant_id").as_string();
        return d.get_payload_claim("role").as_string() == "SUPER_ADMIN";
    }

    void list(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            std::string uid, tn; if (!superAdmin(req, uid, tn)) return fail(cb, "Forbidden", k403Forbidden);
            auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
            auto rows = t.exec("SELECT t.id::text, t.airport_code, t.airport_name, COALESCE(t.subscription_plan,''), "
                               "(SELECT COUNT(*) FROM users u WHERE u.tenant_id=t.id), (SELECT COUNT(*) FROM flights f WHERE f.tenant_id=t.id), "
                               "to_char(t.created_at,'YYYY-MM-DD') FROM tenants t ORDER BY t.airport_code");
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) { Json::Value o; o["id"] = r[0].c_str(); o["code"] = r[1].c_str(); o["name"] = r[2].c_str(); o["plan"] = r[3].c_str(); o["users"] = r[4].as<int>(); o["flights"] = r[5].as<int>(); o["created_at"] = r[6].is_null() ? "" : r[6].c_str(); arr.append(o); }
            Json::Value out; out["tenants"] = arr; reply(cb, out);
        } catch (const std::exception&) { fail(cb, "Internal server error", k500InternalServerError); }
    }

    void create(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            std::string uid, tn; if (!superAdmin(req, uid, tn)) return fail(cb, "Forbidden", k403Forbidden);
            auto j = req->getJsonObject(); if (!j) return fail(cb, "JSON body required", k400BadRequest);
            const std::string name = (*j)["airport_name"].asString(), code = (*j)["airport_code"].asString();
            std::string plan = (*j)["plan"].asString(); if (plan.empty()) plan = "STANDARD";
            static const std::regex codeRe("^[A-Z]{3,4}$"); static const std::regex planRe("^(STARTER|BASIC|STANDARD|PREMIUM|ENTERPRISE)$");
            if (!std::regex_match(code, codeRe)) return fail(cb, "airport_code must be 3-4 capital letters", k400BadRequest);
            if (name.empty() || name.size() > 100) return fail(cb, "airport_name required (max 100)", k400BadRequest);
            if (!std::regex_match(plan, planRe)) return fail(cb, "Unknown plan", k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("INSERT INTO tenants (id, airport_name, airport_code, subscription_plan) VALUES (gen_random_uuid(), $1, $2, $3) ON CONFLICT DO NOTHING RETURNING id::text", name, code, plan);
            t.commit();
            if (r.empty()) return fail(cb, "That airport code already exists", k409Conflict);
            Json::Value d; d["code"] = code; AuditWriter::record(tn, uid, "TENANT_CREATED", "tenant", d, req->peerAddr().toIp());
            Json::Value out; out["id"] = r[0][0].c_str(); out["code"] = code; reply(cb, out, k201Created);
        } catch (const std::exception&) { fail(cb, "Internal server error", k500InternalServerError); }
    }
};
