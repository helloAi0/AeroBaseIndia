#pragma once
#include <drogon/drogon.h>
#include "../services/JwtService.h"

// Identity taken ONLY from the verified JWT (never from client-supplied headers like X-Tenant-ID).
namespace jwtid {
struct Identity { std::string role, tenant, user, org; };
inline bool identify(const drogon::HttpRequestPtr& req, Identity& out) {
    try {
        const std::string h = req->getHeader("Authorization");
        if (h.size() <= 7 || h.rfind("Bearer ", 0) != 0) return false;
        auto d = JwtService::verifyToken(h.substr(7));
        out.role = d.get_payload_claim("role").as_string();
        out.tenant = d.get_payload_claim("tenant_id").as_string();
        out.user = d.get_payload_claim("user_id").as_string();
        if (d.has_payload_claim("org")) out.org = d.get_payload_claim("org").as_string();
        return !out.tenant.empty();
    } catch (const std::exception&) { return false; }
}
inline drogon::HttpResponsePtr error(drogon::HttpStatusCode c, const char* m) {
    Json::Value e; e["error"] = m; auto r = drogon::HttpResponse::newHttpJsonResponse(e); r->setStatusCode(c); return r;
}
}
