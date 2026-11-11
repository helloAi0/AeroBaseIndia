#pragma once
#include <drogon/drogon.h>
#include <cstdlib>
#include "../services/JwtService.h"

// Central deny-by-default guard for sensitive routes. Runs before routing so that
// no handler can accidentally ship unauthenticated.
namespace routeguard {

enum class Level { Public, AnyUser, Admin };

inline bool starts(const std::string& p, const char* prefix) { return p.rfind(prefix, 0) == 0; }

inline Level levelFor(const std::string& p) {
    if (p == "/health" || p == "/login" || p == "/docs" || p == "/api-docs" || p == "/redoc") return Level::Public;
    if (p == "/api/passenger/register" || p == "/api/passenger/login") return Level::Public;
    if (starts(p, "/payments/webhook/")) return Level::Public;      // verified by signature in handler
    if (starts(p, "/api/partner/")) return Level::Public;           // PartnerAuthFilter / API key
    if (starts(p, "/notify/")) return Level::Public;                // handlers use adminauth::require
    if (p == "/metrics" || starts(p, "/audit") || starts(p, "/payments/order") ||
        starts(p, "/api/compliance") || starts(p, "/api/billing") || starts(p, "/traces") ||
        starts(p, "/api/internal") || starts(p, "/api/partner-keys") || p == "/predict/cascade") return Level::Admin;
    if (starts(p, "/api/twin") || starts(p, "/api/records/") || starts(p, "/api/revenue") || starts(p, "/api/passenger/") ||
        starts(p, "/predict/") || starts(p, "/graphql") || (starts(p, "/flights") && p.size() > 8)) return Level::AnyUser;
    return Level::Public;
}

inline drogon::HttpResponsePtr deny(drogon::HttpStatusCode c, const char* m) {
    Json::Value e; e["error"] = m;
    auto r = drogon::HttpResponse::newHttpJsonResponse(e);
    r->setStatusCode(c);
    return r;
}

// Returns nullptr when allowed, otherwise the response to send.
inline drogon::HttpResponsePtr check(const drogon::HttpRequestPtr& req) {
    if (req->method() == drogon::HttpMethod::Options) return nullptr;
    const std::string path = req->path();
    const Level lvl = levelFor(path);
    if (lvl == Level::Public) return nullptr;

    const std::string h = req->getHeader("Authorization");
    if (h.size() <= 7 || h.rfind("Bearer ", 0) != 0) return deny(drogon::k401Unauthorized, "Unauthorized");

    // Optional scrape token for Prometheus
    if (path == "/metrics") {
        const char* t = std::getenv("METRICS_TOKEN");
        if (t && *t && h.substr(7) == t) return nullptr;
    }
    try {
        auto d = JwtService::verifyToken(h.substr(7));
        if (lvl == Level::Admin) {
            const std::string role = d.get_payload_claim("role").as_string();
            if (role != "AIRPORT_ADMIN" && role != "SUPER_ADMIN") return deny(drogon::k403Forbidden, "Forbidden");
        }
    } catch (const std::exception&) {
        return deny(drogon::k401Unauthorized, "Unauthorized");
    }
    return nullptr;
}
}
