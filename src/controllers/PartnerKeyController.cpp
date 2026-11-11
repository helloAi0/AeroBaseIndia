#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <regex>
#include "../config/DatabaseManager.h"
#include "../services/JwtService.h"
#include "../services/AuditWriter.h"
#include "../security/PartnerApiKeyService.h"

using namespace drogon;

// Admin-only (RouteGuard) management of airline API keys for the B2B partner endpoints.
//   POST   /api/partner-keys        {partner_id, label?}  -> raw key, shown once
//   GET    /api/partner-keys                               -> list (never the key itself)
//   DELETE /api/partner-keys/{id}                          -> revoke
class PartnerKeyController : public HttpController<PartnerKeyController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(PartnerKeyController::create, "/api/partner-keys", Post);
        ADD_METHOD_TO(PartnerKeyController::list, "/api/partner-keys", Get);
        ADD_METHOD_TO(PartnerKeyController::revoke, "/api/partner-keys/{1}", Delete);
    METHOD_LIST_END

    static void reply(const std::function<void(const HttpResponsePtr&)>& cb, const Json::Value& v, HttpStatusCode c = k200OK) {
        auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r);
    }
    static Json::Value err(const char* m) { Json::Value e; e["error"] = m; return e; }
    static bool admin(const HttpRequestPtr& req, std::string& tenant, std::string& userId) {
        auto d = JwtService::verifyToken(req->getHeader("Authorization").substr(7));
        tenant = d.get_payload_claim("tenant_id").as_string(); userId = d.get_payload_claim("user_id").as_string();
        return !tenant.empty();
    }

    void create(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            std::string tenant, uid; if (!admin(req, tenant, uid)) return reply(cb, err("No airport on token"), k403Forbidden);
            auto j = req->getJsonObject(); if (!j) return reply(cb, err("JSON body required"), k400BadRequest);
            const std::string partner = (*j)["partner_id"].asString();
            static const std::regex re("^[A-Za-z0-9_-]{2,32}$");
            if (!std::regex_match(partner, re)) return reply(cb, err("partner_id must be 2-32 letters, digits, - or _"), k400BadRequest);
            const std::string raw = PartnerApiKeyService::createKeyForPartner(partner, tenant);
            if (raw.empty()) return reply(cb, err("Could not create key"), k500InternalServerError);
            const std::string label = (*j)["label"].asString().substr(0, 100);
            if (!label.empty()) {
                auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
                t.exec_params("UPDATE partner_api_keys SET label = $1 WHERE partner_id = $2 AND tenant_id = $3::uuid AND created_at = (SELECT MAX(created_at) FROM partner_api_keys WHERE partner_id = $2 AND tenant_id = $3::uuid)", label, partner, tenant);
                t.commit();
            }
            Json::Value d; d["partner_id"] = partner; AuditWriter::record(tenant, uid, "PARTNER_KEY_CREATED", "partner_api_key", d, req->peerAddr().toIp());
            Json::Value out; out["partner_id"] = partner; out["api_key"] = raw; out["note"] = "Store this key now. It cannot be shown again.";
            reply(cb, out, k201Created);
        } catch (const std::exception&) { reply(cb, err("Internal server error"), k500InternalServerError); }
    }

    void list(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        try {
            std::string tenant, uid; if (!admin(req, tenant, uid)) return reply(cb, err("No airport on token"), k403Forbidden);
            auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
            auto rows = t.exec_params("SELECT id::text, partner_id, COALESCE(label,''), is_active, to_char(created_at,'YYYY-MM-DD HH24:MI'), COALESCE(to_char(last_used_at,'YYYY-MM-DD HH24:MI'),'') "
                                      "FROM partner_api_keys WHERE tenant_id = $1::uuid ORDER BY created_at DESC LIMIT 200", tenant);
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) { Json::Value k; k["id"] = r[0].c_str(); k["partner_id"] = r[1].c_str(); k["label"] = r[2].c_str(); k["active"] = r[3].as<bool>(); k["created_at"] = r[4].c_str(); k["last_used_at"] = r[5].c_str(); arr.append(k); }
            Json::Value out; out["keys"] = arr; reply(cb, out);
        } catch (const std::exception&) { reply(cb, err("Internal server error"), k500InternalServerError); }
    }

    void revoke(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb, std::string id) {
        try {
            std::string tenant, uid; if (!admin(req, tenant, uid)) return reply(cb, err("No airport on token"), k403Forbidden);
            static const std::regex uuid("^[0-9a-fA-F-]{36}$");
            if (!std::regex_match(id, uuid)) return reply(cb, err("Invalid id"), k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("UPDATE partner_api_keys SET is_active = FALSE WHERE id = $1::uuid AND tenant_id = $2::uuid", id, tenant);
            t.commit();
            if (r.affected_rows() == 0) return reply(cb, err("Key not found"), k404NotFound);
            Json::Value d; d["id"] = id; AuditWriter::record(tenant, uid, "PARTNER_KEY_REVOKED", "partner_api_key", d, req->peerAddr().toIp());
            Json::Value out; out["revoked"] = true; reply(cb, out);
        } catch (const std::exception&) { reply(cb, err("Internal server error"), k500InternalServerError); }
    }
};
