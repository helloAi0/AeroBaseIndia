#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include <regex>
#include <set>
#include <map>
#include <random>
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
    struct Policy { Roles read, create, modify; bool ownOnlyRead = false; Roles ownRoles = {}; Roles ownWrite = {}; Roles orgRoles = {}; };   // orgRoles: only see/change records of their own airline (data.airline == org)   // ownRoles: roles that only see records they created

    static const std::map<std::string, Policy>& policies() {
        static const Roles OPS{"SUPER_ADMIN", "AIRPORT_ADMIN", "GROUND_STAFF", "SECURITY_OFFICER"};
        static const Roles ADMIN{"SUPER_ADMIN", "AIRPORT_ADMIN"};
        static const Roles OPS_AIR = [] { Roles r = OPS; r.insert("AIRLINE_OPS"); return r; }();
        static const std::map<std::string, Policy> P = {
            {"accessibility", {[] { Roles r = OPS; r.insert("PASSENGER"); return r; }(), [] { Roles r = OPS; r.insert("PASSENGER"); return r; }(), OPS, false, {"PASSENGER"}}},   // passengers can ask for help and see only their own requests
            {"lostfound",     {OPS, OPS, OPS}},
            {"incidents",     {OPS_AIR, OPS, OPS}},
            {"maintenance",   {OPS_AIR, OPS, OPS}},
            {"cargo",         {OPS_AIR, OPS, OPS}},
            {"parking",       {OPS, OPS, OPS}},
            {"fuel",          {OPS_AIR, OPS, OPS}},
            {"feedback",      {OPS, [] { Roles r = OPS; r.insert("PASSENGER"); r.insert("AIRLINE_OPS"); return r; }(), OPS}},
            {"contracts",     {ADMIN, ADMIN, ADMIN}},
            {"emergency",     {OPS, OPS, OPS}},
            {"baggage",       {[] { Roles r = OPS_AIR; r.insert("PASSENGER"); return r; }(), [] { Roles r = OPS; r.insert("PASSENGER"); return r; }(), OPS, false, {"PASSENGER"}}},   // passengers register and see only their own bags
            {"security_events", {OPS, {"SUPER_ADMIN", "AIRPORT_ADMIN", "SECURITY_OFFICER"}, {"SUPER_ADMIN", "AIRPORT_ADMIN", "SECURITY_OFFICER"}}},
            {"checkins",      {OPS_AIR, OPS, OPS}},
            {"staff",         {OPS, ADMIN, ADMIN}},
            {"actions",       {OPS, OPS, ADMIN}},          // approved autopilot / playbook actions
            {"announcements", {OPS, OPS, ADMIN}},
            {"settings",      {ADMIN, ADMIN, ADMIN}},
            {"lane_config",   {OPS, OPS, ADMIN}},          // counters / lanes open per terminal zone
            {"stores",        {[] { Roles r = OPS; r.insert("RETAILER"); r.insert("PASSENGER"); r.insert("AIRLINE_OPS"); return r; }(), [] { Roles r = ADMIN; r.insert("RETAILER"); return r; }(), [] { Roles r = ADMIN; r.insert("RETAILER"); return r; }(), false, {}, {"RETAILER"}}},   // a retailer creates and edits only their own shop
            {"crew",          {[] { Roles r = ADMIN; r.insert("AIRLINE_OPS"); r.insert("PILOT"); return r; }(), [] { Roles r = ADMIN; r.insert("AIRLINE_OPS"); return r; }(), [] { Roles r = ADMIN; r.insert("AIRLINE_OPS"); return r; }(), false, {"PILOT"}, {}, {"AIRLINE_OPS"}}},   // reference IDs issued by the airline; a pilot sees only their own record
            {"dispatch",      {[] { Roles r = ADMIN; r.insert("SECURITY_OFFICER"); return r; }(), [] { Roles r = ADMIN; r.insert("SECURITY_OFFICER"); return r; }(), [] { Roles r = ADMIN; r.insert("SECURITY_OFFICER"); return r; }(), false, {"SECURITY_OFFICER"}, {"SECURITY_OFFICER"}}},   // security head -> officers; the head and directors see all, an officer only their own
            {"products",      {[] { Roles r = OPS; r.insert("RETAILER"); r.insert("PASSENGER"); return r; }(), [] { Roles r = ADMIN; r.insert("RETAILER"); return r; }(), [] { Roles r = ADMIN; r.insert("RETAILER"); return r; }(), false, {}, {"RETAILER"}}},
            {"orders",        {[] { Roles r = OPS; r.insert("RETAILER"); r.insert("PASSENGER"); return r; }(), {"PASSENGER"}, [] { Roles r = OPS; r.insert("RETAILER"); r.insert("PASSENGER"); return r; }(), false, {"RETAILER", "PASSENGER"}, {"RETAILER", "PASSENGER"}}},   // placed by passengers; the shop owner sees and moves only their shop's orders
            {"passes",        {[] { Roles r = ADMIN; r.insert("PASSENGER"); return r; }(), {"PASSENGER", "AIRPORT_ADMIN", "SUPER_ADMIN"}, ADMIN, true}},
            {"bids",          {[] { Roles r = ADMIN; r.insert("RETAILER"); return r; }(), {"RETAILER"}, ADMIN, true}},
        };
        return P;
    }
    static void reply(const std::function<void(const HttpResponsePtr&)>& cb, const Json::Value& v, HttpStatusCode c = k200OK) {
        auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r);
    }
    static void fail(const std::function<void(const HttpResponsePtr&)>& cb, const char* m, HttpStatusCode c) { Json::Value e; e["error"] = m; reply(cb, e, c); }

    struct Who { std::string role, tenant, user, name, org; };
    static bool isHead(const Who& w) { return w.role == "SECURITY_OFFICER" && w.org == "HEAD"; }
    static bool who(const HttpRequestPtr& req, Who& w) {
        const std::string h = req->getHeader("Authorization");
        if (h.size() <= 7) return false;
        auto d = JwtService::verifyToken(h.substr(7));
        w.role = d.get_payload_claim("role").as_string(); w.tenant = d.get_payload_claim("tenant_id").as_string(); w.user = d.get_payload_claim("user_id").as_string();
        if (d.has_payload_claim("name")) w.name = d.get_payload_claim("name").as_string();
        if (d.has_payload_claim("org")) w.org = d.get_payload_claim("org").as_string();
        return !w.tenant.empty();
    }
    static Json::Value row(const pqxx::row& r) {
        Json::Value v; Json::CharReaderBuilder b; std::string errs; std::istringstream is(r[1].c_str());
        if (!Json::parseFromStream(b, is, &v, &errs) || !v.isObject()) v = Json::Value(Json::objectValue);
        v["id"] = r[0].c_str(); v["created_at"] = r[2].c_str(); return v;
    }
    static std::string dump(const Json::Value& v) { Json::StreamWriterBuilder w; w["indentation"] = ""; return Json::writeString(w, v); }

    static bool isUuid(const std::string& v) { static const std::regex u("^[0-9a-fA-F-]{36}$"); return std::regex_match(v, u); }
    static std::string clip(const Json::Value& j, const char* k, size_t n) { if (!j.isObject() || !j[k].isString()) return ""; std::string v = j[k].asString(); if (v.size() > n) v.resize(n); return v; }

    // Passenger places an order: stock is checked and reserved, the total comes from stored prices (never from the client).
    static void placeOrder(const Who& w, const Json::Value& in, const HttpRequestPtr& req, const std::function<void(const HttpResponsePtr&)>& cb) {
        const std::string shopId = clip(in, "shopId", 40);
        if (!isUuid(shopId) || !in["items"].isArray() || in["items"].empty() || in["items"].size() > 30) return fail(cb, "Choose a shop and at least one item", k400BadRequest);
        auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
        auto shop = t.exec_params("SELECT data->>'name', COALESCE(data->>'ownerId',''), COALESCE(data->>'status','Open'), COALESCE(data->>'terminal','') FROM app_records WHERE id=$1::uuid AND tenant_id=$2::uuid AND collection='stores'", shopId, w.tenant);
        if (shop.empty()) return fail(cb, "Unknown shop", k400BadRequest);
        if (std::string(shop[0][2].c_str()) != "Open") return fail(cb, "This shop is closed right now", k409Conflict);
        const std::string owner = shop[0][1].c_str();
        Json::Value items(Json::arrayValue); double total = 0;
        for (const auto& it : in["items"]) {
            const std::string pid = clip(it, "id", 40); int qty = it["qty"].isInt() ? it["qty"].asInt() : 0;
            if (!isUuid(pid) || qty < 1 || qty > 20) return fail(cb, "Invalid item", k400BadRequest);
            auto p = t.exec_params("SELECT data->>'name', data->>'price', COALESCE(data->>'ownerId',''), data->>'stock', COALESCE(data->>'available','Yes') FROM app_records WHERE id=$1::uuid AND tenant_id=$2::uuid AND collection='products' FOR UPDATE", pid, w.tenant);
            if (p.empty() || std::string(p[0][2].c_str()) != owner) return fail(cb, "An item is not sold by this shop", k400BadRequest);
            const std::string pname = p[0][0].c_str();
            if (std::string(p[0][4].c_str()) == "No") return fail(cb, (pname + " is not available right now").c_str(), k409Conflict);
            if (!p[0][3].is_null() && std::string(p[0][3].c_str()) != "") {
                auto up = t.exec_params("UPDATE app_records SET data = jsonb_set(data, '{stock}', to_jsonb((data->>'stock')::int - $2::int)) WHERE id=$1::uuid AND (data->>'stock')::int >= $2::int", pid, qty);
                if (up.affected_rows() == 0) return fail(cb, (pname + " is out of stock").c_str(), k409Conflict);
            }
            double price = p[0][1].is_null() ? 0 : std::atof(p[0][1].c_str());
            Json::Value row; row["id"] = pid; row["name"] = pname; row["price"] = price; row["qty"] = qty; items.append(row); total += price * qty;
        }
        const std::string mode = clip(in, "deliver", 8) == "Pickup" ? "Pickup" : "Gate";
        static std::mt19937 rng{std::random_device{}()};
        Json::Value d; d["ref"] = "ORD-" + std::to_string(10000 + rng() % 90000); d["shopId"] = shopId; d["shopName"] = shop[0][0].c_str(); d["ownerId"] = owner;
        d["items"] = items; d["total"] = total; d["status"] = "New"; d["deliver"] = mode; d["payment"] = mode == "Gate" ? "Pay on delivery" : "Pay at the counter";
        d["terminal"] = clip(in, "terminal", 12); d["gate"] = clip(in, "gate", 12); d["flight"] = clip(in, "flight", 12); d["note"] = clip(in, "note", 200); d["passenger"] = w.name.empty() ? "Passenger" : w.name;
        if (mode == "Gate" && d["gate"].asString().empty()) return fail(cb, "Tell us your gate so we can bring the order to you", k400BadRequest);
        auto r = t.exec_params("INSERT INTO app_records (tenant_id, collection, data, created_by) VALUES ($1::uuid, 'orders', $2::jsonb, $3::uuid) RETURNING id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS')", w.tenant, dump(d), w.user);
        t.commit();
        Json::Value a; a["collection"] = "orders"; AuditWriter::record(w.tenant, w.user, "RECORD_CREATED", "orders", a, req->peerAddr().toIp());
        reply(cb, row(r[0]), k201Created);
    }

    // Status changes on an order. Shop owners / staff move it forward; the passenger may cancel while it is still New. Cancelling returns the stock.
    static void updateOrder(const Who& w, const std::string& id, const Json::Value& in, const HttpRequestPtr& req, const std::function<void(const HttpResponsePtr&)>& cb) {
        static const std::set<std::string> ok{"New", "Accepted", "Preparing", "Ready", "Out for delivery", "Delivered", "Cancelled"};
        const std::string next = clip(in, "status", 24); if (!ok.count(next)) return fail(cb, "Unknown status", k400BadRequest);
        auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
        const bool admin = w.role == "SUPER_ADMIN" || w.role == "AIRPORT_ADMIN", staff = w.role == "GROUND_STAFF" || w.role == "SECURITY_OFFICER";
        auto cur = t.exec_params("SELECT data::text FROM app_records WHERE id=$1::uuid AND tenant_id=$2::uuid AND collection='orders' AND ($3 OR created_by=$4::uuid OR data->>'ownerId'=$4::text) FOR UPDATE", id, w.tenant, admin || staff, w.user);
        if (cur.empty()) return fail(cb, "Not found", k404NotFound);
        Json::Value d; { Json::CharReaderBuilder b; std::string e; std::istringstream is(cur[0][0].c_str()); Json::parseFromStream(b, is, &d, &e); }
        const std::string old = d["status"].asString();
        if (w.role == "PASSENGER" && !(next == "Cancelled" && old == "New")) return fail(cb, "You can only cancel an order that the shop has not accepted yet", k403Forbidden);
        if (old == "Delivered" || old == "Cancelled") return fail(cb, "This order is already closed", k409Conflict);
        if (next == "Cancelled") for (const auto& it : d["items"]) if (isUuid(it["id"].asString()))
            t.exec_params("UPDATE app_records SET data = jsonb_set(data, '{stock}', to_jsonb((data->>'stock')::int + $2::int)) WHERE id=$1::uuid AND collection='products' AND data->>'stock' IS NOT NULL AND data->>'stock' <> ''", it["id"].asString(), it["qty"].asInt());
        auto r = t.exec_params("UPDATE app_records SET data = data || jsonb_build_object('status', $2::text), updated_at = CURRENT_TIMESTAMP WHERE id=$1::uuid RETURNING id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS')", id, next);
        t.commit();
        Json::Value a; a["collection"] = "orders"; a["id"] = id; a["status"] = next; AuditWriter::record(w.tenant, w.user, "RECORD_UPDATED", "orders", a, req->peerAddr().toIp());
        reply(cb, row(r[0]));
    }

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
            const bool own = ((it->second.ownOnlyRead && !(w.role == "SUPER_ADMIN" || w.role == "AIRPORT_ADMIN")) || it->second.ownRoles.count(w.role) > 0) && !(coll == "dispatch" && isHead(w));
            const std::string orgF = it->second.orgRoles.count(w.role) ? (w.org.empty() ? "-" : w.org) : "";
            auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
            auto rows = t.exec_params("SELECT id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS') FROM app_records "
                                      "WHERE tenant_id = $1::uuid AND collection = $2 AND ($3 = FALSE OR created_by = $4::uuid OR data->>'ownerId' = $4::text OR data->>'claimedBy' = $4::text OR data->>'toId' = $4::text) "
                                      "AND ($5 = '' OR data->>'airline' = $5) "
                                      "ORDER BY created_at DESC LIMIT 500", w.tenant, coll, own, w.user, orgF);
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
            if (coll == "orders") return placeOrder(w, data, req, cb);
            if (coll == "dispatch") {   // only the security head or a director may send instructions
                if (!(w.role == "SUPER_ADMIN" || w.role == "AIRPORT_ADMIN" || isHead(w))) return fail(cb, "Only the security head can send instructions", k403Forbidden);
                data["from"] = w.name; data["status"] = "New";
                if (!isUuid(data["toId"].asString())) return fail(cb, "Choose an officer", k400BadRequest);
            }
            if (coll == "crew") {   // the airline's operations team issues reference IDs; the server generates and owns them
                const std::string al = w.role == "AIRLINE_OPS" ? w.org : data["airline"].asString();
                if (al.empty() || al.size() > 3) return fail(cb, "Airline code is required", k400BadRequest);
                static std::mt19937 rg{std::random_device{}()}; char buf[16]; std::snprintf(buf, sizeof buf, "%06X", (unsigned)(rg() & 0xFFFFFF));
                std::string up = al; for (auto& ch : up) ch = (char)std::toupper((unsigned char)ch);
                data["airline"] = up; data["refId"] = up + "-" + (data["rank"].asString() == "Cabin crew" ? "CC" : "FD") + "-" + buf; data["status"] = "Unclaimed";
                data.removeMember("claimedBy"); data.removeMember("claimedName");
            }
            if ((coll == "stores" || coll == "products") && w.role == "RETAILER") {
                data["ownerId"] = w.user;
                if (coll == "stores") {   // one shop per retailer account
                    auto conn0 = DatabaseManager::getConnection(); pqxx::read_transaction t0(*conn0);
                    if (!t0.exec_params("SELECT 1 FROM app_records WHERE tenant_id=$1::uuid AND collection='stores' AND created_by=$2::uuid LIMIT 1", w.tenant, w.user).empty()) return fail(cb, "You already have a shop", k409Conflict);
                }
            }
            if (coll == "passes" && !(w.role == "SUPER_ADMIN" || w.role == "AIRPORT_ADMIN")) data["status"] = "Requested";   // passengers cannot self-approve
            if (coll == "accessibility" && w.role == "PASSENGER") { data["status"] = "Open"; data.removeMember("staff"); data.removeMember("eta"); data.removeMember("staffName"); }   // no self-assignment
            if (coll == "baggage" && w.role == "PASSENGER") { data["status"] = "Checked in"; data.removeMember("belt"); }   // only handlers move a bag along
            const std::string js = dump(data);
            if (js.size() > 8192 || js.size() < 3) return fail(cb, "Record too large or empty", k400BadRequest);
            if (js.find("\\u0000") != std::string::npos) return fail(cb, "Text contains an invalid character", k400BadRequest);
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
            if (coll == "orders") return updateOrder(w, id, data, req, cb);
            data.removeMember("ownerId"); data.removeMember("claimedBy"); data.removeMember("refId"); data.removeMember("toId");   // identity fields can never be re-assigned from the client
            const bool mustOwn = it->second.ownWrite.count(w.role) > 0 && !(coll == "dispatch" && isHead(w));
            const std::string orgF = it->second.orgRoles.count(w.role) ? (w.org.empty() ? "-" : w.org) : "";
            if (coll == "dispatch" && !(w.role == "SUPER_ADMIN" || w.role == "AIRPORT_ADMIN" || isHead(w))) {   // an officer can only acknowledge / resolve their own instruction
                const std::string st = data["status"].asString(); if (st != "Acknowledged" && st != "Resolved") return fail(cb, "Invalid status", k400BadRequest);
                Json::Value only; only["status"] = st; if (data["response"].isString()) only["response"] = data["response"].asString().substr(0, 200); data = only;
            }
            const std::string js = dump(data); if (js.size() > 8192) return fail(cb, "Record too large", k400BadRequest);
            if (js.find("\\u0000") != std::string::npos) return fail(cb, "Text contains an invalid character", k400BadRequest);
            auto conn = DatabaseManager::getConnection(); pqxx::work t(*conn);
            auto r = t.exec_params("UPDATE app_records SET data = data || $4::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $1::uuid AND tenant_id = $2::uuid AND collection = $3 "
                                   "AND (NOT $5 OR created_by = $6::uuid OR data->>'ownerId' = $6::text OR data->>'toId' = $6::text) AND ($7 = '' OR data->>'airline' = $7) "
                                   "RETURNING id::text, data::text, to_char(created_at,'YYYY-MM-DD\"T\"HH24:MI:SS')", id, w.tenant, coll, js, mustOwn, w.user, orgF);
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
            auto r = t.exec_params("DELETE FROM app_records WHERE id = $1::uuid AND tenant_id = $2::uuid AND collection = $3 AND (NOT $4 OR created_by = $5::uuid OR data->>'ownerId' = $5::text) AND ($6 = '' OR data->>'airline' = $6)", id, w.tenant, coll, it->second.ownWrite.count(w.role) > 0 && !(coll == "dispatch" && isHead(w)), w.user, it->second.orgRoles.count(w.role) ? (w.org.empty() ? "-" : w.org) : std::string());
            t.commit();
            if (r.affected_rows() == 0) return fail(cb, "Not found", k404NotFound);
            Json::Value d; d["collection"] = coll; d["id"] = id; AuditWriter::record(w.tenant, w.user, "RECORD_DELETED", coll, d, req->peerAddr().toIp());
            Json::Value out; out["deleted"] = true; reply(cb, out);
        } catch (const std::exception&) { fail(cb, "Could not delete", k500InternalServerError); }
    }
};
