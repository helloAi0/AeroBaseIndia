#pragma once
#include <drogon/drogon.h>
#include "../services/JwtService.h"

namespace adminauth {
// Returns true if the request carries a valid JWT for AIRPORT_ADMIN / SUPER_ADMIN.
// Otherwise fills `out` with a 401/403 JSON response.
inline bool require(const drogon::HttpRequestPtr& req, drogon::HttpResponsePtr& out) {
    auto fail = [&](drogon::HttpStatusCode c, const char* m) {
        Json::Value e; e["error"] = m;
        out = drogon::HttpResponse::newHttpJsonResponse(e); out->setStatusCode(c); return false;
    };
    try {
        const std::string h = req->getHeader("Authorization");
        if (h.rfind("Bearer ", 0) != 0 || h.size() <= 7) return fail(drogon::k401Unauthorized, "Unauthorized");
        auto d = JwtService::verifyToken(h.substr(7));
        const std::string role = d.get_payload_claim("role").as_string();
        if (role != "AIRPORT_ADMIN" && role != "SUPER_ADMIN") return fail(drogon::k403Forbidden, "Forbidden");
        return true;
    } catch (const std::exception&) {
        return fail(drogon::k401Unauthorized, "Unauthorized");
    }
}
}
