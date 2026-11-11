#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <regex>
#include <set>
#include <map>
#include "../config/DatabaseManager.h"
#include "../services/JwtService.h"
#include "../services/AuditWriter.h"

using namespace drogon;

// Tenant-scoped document store behind the operational pages (requests, incidents, bids, ...).
//   GET    /api/records/{collection}
//   POST   /api/records/{collection}        body: JSON object
//   PUT    /api/records/{collection}/{id}   body: fields to merge
//   DELETE /api/records/{collection}/{id}
// Which roles may read/write each collection is the policy table below; everything else is refused.
class RecordsController : public HttpController<RecordsController> {
    using Roles = std::set<std::string>;
    struct Policy { Roles read, create, modify; bool ownOnlyRead = false; };

    static const std::map<std::string, Policy>& policies() {
        static const Roles OPS{"SUPER_ADMIN", "AIRPORT_ADMIN", "GROUND_STAFF", "SECURITY_OFFICER"};
        static const Roles ADMIN{"SUPER_ADMIN", "AIRPORT_ADMIN"};
        static const Roles OPS_AIR = [] { Roles r = OPS; r.insert("AIRLINE_OPS"); return r; }();
        static const std::map<std::string, Policy> P = {
            {"accessibility", {OPS, OPS, OPS}},
            {"lostfound",     {OPS, OPS, OPS}},
            {"incidents",     {OPS_AIR, OPS, OPS}},
            {"maintenance",   {OPS_AIR, OPS, OPS}},
            {"cargo",         {OPS_AIR, OPS, OPS}},
            {"parking",       {OPS, OPS, OPS}},
            {"fuel",          {OPS_AIR, OPS, OPS}},
            {"feedback",      {OPS, OPS, OPS}},
            {"contracts",     {ADMIN, ADMIN, ADMIN}},
            {"emergency",     {OPS, OPS, OPS}},
            {"actions",       {OPS, OPS, ADMIN}},          // approved autopilot / playbook actions
            {"announcements", {OPS, OPS, ADMIN}},
            {"bids",          {[] { Roles r = ADMIN; r.insert("RETAILER"); return r; }(), {"RETAILER"}, ADMIN, true}},
        };
        return P;
    }
    static void reply(const std::function<void(const HttpResponsePtr&)>& cb, const Json::Value& v, HttpStatusCode c = k200OK) {
        auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r);
    }
    static void fail(const std::function<void(const HttpResponsePtr&)>& cb, const char* m, HttpStatusCode c) { Json::Value e; e["error"] = m; reply(cb, e, c); }

    struct Who { std::string role, tenant, user; };
    static bool who(const HttpRequestPtr& req, Who& w) {
        const std::string h = req->getHeader("Authorization");
        if (h.size() <= 7) return false;
        auto d = JwtService::verifyToken(h.substr(7));
        w.role = d.get_payload_claim("role").as_string(); w.tenant = d.get_payload_claim("tenant_id").as_string(); w.user = d.get_payload_claim("user_id").as_string();
        return !w.tenant.empty();
    }
    static Json::Value row(const pqxx::row& r) {
        Json::Value v; Json::CharReaderBuilder b; std::string errs; std::istringstream is(r[1].c_str());
        if (!Json::parseFromStream(b, is, &v, &errs) || !v.isObject()) v = Json::Value(Json::objectValue);
        v["id"] = r[0].c_str(); v["created_at"] = r[2].c_str(); return v;
    }
    static std::string dump(const Json::Value& v) { Json::StreamWriterBuilder w; w["indentation"] = ""; return Json::writeString(w, v); }

public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(RecordsController::list,   "/api/records/{1}",      Get);
        ADD_METHOD_TO(RecordsController::create, "/api/records/{1}",      Post);
        ADD_METHOD_TO(RecordsController::modify, "/api/records/{1}/{2}",  Put);
        ADD_METHOD_TO(RecordsController::remove, "/api/records/{1}/{2}",  Delete);
    METHOD_LIST_END

    void list(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb, std::string coll) {
        try {
            Who w; if (!who(req, w)) return fail(cb, "Unauthorized", k401Unauthorized);
            auto it = policies().find(coll); if (it == policies().end()) return fail(cb, "Unknown collection", k404NotFound);
            if (!it->second.read.count(w.role)) return fail(cb, "Forbidden", k403Forbidden);
            const bool own = it->second.ownOnlyRead && !(w.role == "SUPER_ADMIN" || w.role == "AIRPORT_ADMIN");
            auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
            auto rows = t.exec_params("SELECT id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS') FROM app_records "
                                      "WHERE tenant_id = $1::uuid AND collection = $2 AND ($3 = FALSE OR created_by = $4::uuid) "
                                      "ORDER BY created_at DESC LIMIT 500", w.tenant, coll, own, w.user);
            Json::Value arr(Json::arrayValue); for (const auto& r : rows) arr.append(row(r));
            Json::Value out; out["records"] = arr; reply(cb, out);
        } catch (const std::exception&) { fail(cb, "Unauthorized", k401Unauthorized); }
    }

    void create(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb, std::string coll) {
        try {
            Who w; if (!who(req, w)) return fail(cb, "Unauthorized", k401Unauthorized);
            auto it = policies().find(coll); if (it == policies().end()) return fail(cb, "Unknown collection", k404NotFound);
            if (!it->second.create.count(w.role)) return fail(cb, "Forbidden", k403Forbidden);
            auto j = req->getJsonObject(); if (!j || !j->isObject()) return fail(cb, "JSON object required", k400BadRequest);
            Json::Value data = *j; data.removeMember("id"); data.removeMember("created_at");
            const std::string js = dump(data);
            if (js.size() > 8192 || js.size() < 3) return fail(cb, "Record too large or empty", k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("INSERT INTO app_records (tenant_id, collection, data, created_by) VALUES ($1::uuid, $2, $3::jsonb, $4::uuid) "
                                   "RETURNING id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS')", w.tenant, coll, js, w.user);
            t.commit();
            Json::Value d; d["collection"] = coll; AuditWriter::record(w.tenant, w.user, "RECORD_CREATED", coll, d, req->peerAddr().toIp());
            reply(cb, row(r[0]), k201Created);
        } catch (const std::exception&) { fail(cb, "Could not save", k500InternalServerError); }
    }

    void modify(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb, std::string coll, std::string id) {
        try {
            Who w; if (!who(req, w)) return fail(cb, "Unauthorized", k401Unauthorized);
            auto it = policies().find(coll); if (it == policies().end()) return fail(cb, "Unknown collection", k404NotFound);
            if (!it->second.modify.count(w.role)) return fail(cb, "Forbidden", k403Forbidden);
            static const std::regex uuid("^[0-9a-fA-F-]{36}$"); if (!std::regex_match(id, uuid)) return fail(cb, "Invalid id", k400BadRequest);
            auto j = req->getJsonObject(); if (!j || !j->isObject()) return fail(cb, "JSON object required", k400BadRequest);
            Json::Value data = *j; data.removeMember("id"); data.removeMember("created_at");
            const std::string js = dump(data); if (js.size() > 8192) return fail(cb, "Record too large", k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("UPDATE app_records SET data = data || $4::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $1::uuid AND tenant_id = $2::uuid AND collection = $3 "
                                   "RETURNING id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS')", id, w.tenant, coll, js);
            t.commit();
            if (r.empty()) return fail(cb, "Not found", k404NotFound);
            Json::Value d; d["collection"] = coll; d["id"] = id; AuditWriter::record(w.tenant, w.user, "RECORD_UPDATED", coll, d, req->peerAddr().toIp());
            reply(cb, row(r[0]));
        } catch (const std::exception&) { fail(cb, "Could not save", k500InternalServerError); }
    }

    void remove(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb, std::string coll, std::string id) {
        try {
            Who w; if (!who(req, w)) return fail(cb, "Unauthorized", k401Unauthorized);
            auto it = policies().find(coll); if (it == policies().end()) return fail(cb, "Unknown collection", k404NotFound);
            if (!it->second.modify.count(w.role)) return fail(cb, "Forbidden", k403Forbidden);
            static const std::regex uuid("^[0-9a-fA-F-]{36}$"); if (!std::regex_match(id, uuid)) return fail(cb, "Invalid id", k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("DELETE FROM app_records WHERE id = $1::uuid AND tenant_id = $2::uuid AND collection = $3", id, w.tenant, coll);
            t.commit();
            if (r.affected_rows() == 0) return fail(cb, "Not found", k404NotFound);
            Json::Value d; d["collection"] = coll; d["id"] = id; AuditWriter::record(w.tenant, w.user, "RECORD_DELETED", coll, d, req->peerAddr().toIp());
            Json::Value out; out["deleted"] = true; reply(cb, out);
        } catch (const std::exception&) { fail(cb, "Could not delete", k500InternalServerError); }
    }
};
