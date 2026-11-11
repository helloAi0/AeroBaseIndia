#include "PartnerAuthFilter.h"
#include "../security/PartnerApiKeyService.h"
#include "../core/Logger.h"
#include <drogon/drogon.h>

void PartnerAuthFilter::doFilter(const HttpRequestPtr& req,
                                 FilterCallback&& fcb,
                                 FilterChainCallback&& fccb) {
    
    // 1. Read the custom headers
    std::string apiKey = req->getHeader("x-api-key");
    std::string partnerId = req->getHeader("x-partner-id");

    if (apiKey.empty() || partnerId.empty()) {
        Json::Value err;
        err["error"] = "Missing X-API-Key or X-Partner-Id header";
        auto res = HttpResponse::newHttpJsonResponse(err);
        res->setStatusCode(k401Unauthorized);
        fcb(res);
        return;
    }

    // 2. Validate identity against the secure hash
    if (!PartnerApiKeyService::verifyKey(partnerId, apiKey)) {
        Logger::warn("Unauthorized Partner Access Attempt: Partner ID " + partnerId);
        Json::Value err;
        err["error"] = "Invalid or inactive API Key";
        auto res = HttpResponse::newHttpJsonResponse(err);
        res->setStatusCode(k401Unauthorized);
        fcb(res);
        return;
    }

    // 3. MAANG Logic: Redis Rate Limiting
    // We do this AFTER auth to avoid wasting Redis CPU on unauthorized junk traffic.
drogon::nosql::RedisClientPtr redisClient;
    try { redisClient = drogon::app().getRedisClient("default"); } catch (...) {}
    if (!redisClient) {            // no Redis configured: fail open, like a Redis outage
        req->getAttributes()->insert("verified_partner_id", partnerId);
        fccb();
        return;
    }
    std::string rateLimitKey = "rate_limit:partner:" + partnerId;

    // We use a multi-command or Lua-style approach to ensure atomicity
    // For this implementation, we use the specific logic you provided:
    redisClient->execCommandAsync(
        [fcb, fccb, partnerId, req](const drogon::nosql::RedisResult &r) {
            if (r.type() == drogon::nosql::RedisResultType::kInteger) {
                long currentCount = r.asInteger();
                
                // If this is the first request in the window, set expiration
                if (currentCount == 1) {
auto redisClient = drogon::app().getRedisClient("default");
                    redisClient->execCommandAsync(nullptr, nullptr, "EXPIRE %s 60", ("rate_limit:partner:" + partnerId).c_str());
                }

                if (currentCount > 1000) { // Limit: 1000 requests per minute
                    Json::Value err;
                    err["error"] = "Rate limit exceeded. Please back off.";
                    auto res = HttpResponse::newHttpJsonResponse(err);
                    res->setStatusCode(k429TooManyRequests);
                    fcb(res);
                    return;
                }
            }
            
            // 4. Inject verified partner ID into request context
            req->getAttributes()->insert("verified_partner_id", partnerId);
            
            // Allow request to proceed
            fccb(); 
        },
        [fccb, partnerId, req](const std::exception &err) {
            // Fail-open strategy: If Redis dies, don't block the partner, just log it.
            Logger::error("Redis Rate Limiter Failed for Partner " + partnerId + ": " + std::string(err.what()));
            
            req->getAttributes()->insert("verified_partner_id", partnerId);
            fccb(); 
        },
        "INCR %s", rateLimitKey.c_str() 
    );
}