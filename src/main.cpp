#include <drogon/drogon.h>
#include "core/Logger.h"
#include "services/JwtService.h"
#include "config/StartupChecks.h"
#include "middleware/RouteGuard.h"
#include <cstdlib>
#include <sstream>

// CORS: "*" by default. Set CORS_ORIGINS (comma list, e.g. https://aerobase.vercel.app) to allow only your site.
static std::string allowedOrigin(const drogon::HttpRequestPtr& req) {
    const char* env = std::getenv("CORS_ORIGINS");
    if (!env || !*env) return "*";
    const std::string origin = req->getHeader("Origin"); std::stringstream ss(env); std::string item;
    while (std::getline(ss, item, ',')) { while (!item.empty() && item.front() == ' ') item.erase(0, 1); while (!item.empty() && (item.back() == ' ' || item.back() == '/')) item.pop_back(); if (!item.empty() && item == origin) return origin; }
    return "";
}

int main() {
    StartupChecks::run();
    JwtService::init();

    // Global CORS middleware
    drogon::app().registerPreRoutingAdvice([](const drogon::HttpRequestPtr& req,
        drogon::AdviceCallback&& cb, drogon::AdviceChainCallback&& ccb) {
        if (req->method() == drogon::HttpMethod::Options) {
            auto resp = drogon::HttpResponse::newHttpResponse();
            if (auto o = allowedOrigin(req); !o.empty()) { resp->addHeader("Access-Control-Allow-Origin", o); resp->addHeader("Vary", "Origin"); }
            resp->addHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
            resp->addHeader("Access-Control-Allow-Headers",
                "Content-Type,Authorization,X-Tenant-ID,X-Request-ID");
            resp->setStatusCode(drogon::k200OK);
            cb(resp);
        } else if (auto denied = routeguard::check(req)) {
            if (auto o = allowedOrigin(req); !o.empty()) denied->addHeader("Access-Control-Allow-Origin", o);
            cb(denied);
        } else {
            ccb();
        }
    });

    drogon::app().registerPostHandlingAdvice([](const drogon::HttpRequestPtr& req,
        const drogon::HttpResponsePtr& resp) {
        if (auto o = allowedOrigin(req); !o.empty()) { resp->addHeader("Access-Control-Allow-Origin", o); resp->addHeader("Vary", "Origin"); }
        resp->addHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers",
            "Content-Type,Authorization,X-Tenant-ID,X-Request-ID");
    });

    drogon::app()
        .loadConfigFile("config.json")
        .run();
    return 0;
}
