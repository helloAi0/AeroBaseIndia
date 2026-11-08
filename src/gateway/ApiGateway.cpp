#include "../tracing/TraceContext.h"
#include "ApiGateway.h"
#include "../core/Logger.h"
#include "../services/JwtService.h"
#include "../metrics/MetricsRegistry.h"
#include <chrono>
#include <json/json.h>

std::unordered_map<std::string, RateLimitBucket> ApiGateway::rateLimits_;

static void recordGatewayMetric(const std::string& path,
                                 const std::string& method,
                                 const std::string& status) {
    std::string labels = "{path=\"" + path +
                         "\",method=\"" + method +
                         "\",status=\"" + status + "\"}";
    MetricsRegistry::getInstance().incrementCounter(
        "aerobase_http_requests_total", labels);
}

void ApiGateway::doFilter(const HttpRequestPtr&  req,
                           FilterCallback&&       fcb,
                           FilterChainCallback&&  fccb) {

    std::string tenantId = req->getHeader("X-Tenant-ID");
    if (tenantId.empty()) {
        std::string auth = req->getHeader("Authorization");
        if (auth.size() > 7) {
            try {
                auto decoded = JwtService::verifyToken(auth.substr(7));
                tenantId = decoded.get_payload_claim("tenant_id").as_string();
            } catch (...) {}
        }
    }
    if (tenantId.empty()) tenantId = "anonymous";

    if (isRateLimited(tenantId)) {
        Json::Value err;
        err["error"] = "Rate limit exceeded";
        err["code"]  = "RATE_LIMITED";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k429TooManyRequests);
        recordGatewayMetric(req->path(), req->methodString(), "429");
        fcb(resp);
        return;
    }

    std::string role = "guest";
    std::string auth = req->getHeader("Authorization");
    if (auth.size() > 7) {
        try {
            auto decoded = JwtService::verifyToken(auth.substr(7));
            role = decoded.get_payload_claim("role").as_string();
        } catch (...) {}
    }

    if (!isRouteAllowed(req->path(), role)) {
        Json::Value err;
        err["error"] = "Forbidden";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k403Forbidden);
        recordGatewayMetric(req->path(), req->methodString(), "403");
        fcb(resp);
        return;
    }

    injectHeaders(req);
    recordGatewayMetric(req->path(), req->methodString(), "200");
    MetricsRegistry::getInstance().incrementGauge("aerobase_active_requests");
    core::Logger::info("[Gateway] " + std::string(req->methodString()) +
                       " " + req->path() + " tenant=" + tenantId);
    // ── Inject trace headers so downstream can continue the trace ──
    auto span = Tracer::getInstance().startSpan(
        std::string(req->methodString()) + " " + req->path());
    span.tenantId = tenantId;
    Tracer::addTag(span, "http.method", req->methodString());
    Tracer::addTag(span, "http.path",   req->path());
    Tracer::addTag(span, "tenant",      tenantId);
    req->addHeader("X-Trace-ID", span.traceId);
    req->addHeader("X-Span-ID",  span.spanId);
    fccb();
    Tracer::getInstance().finishSpan(span, 200);
}

bool ApiGateway::isRateLimited(const std::string& tenantId) {
    auto now = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::steady_clock::now().time_since_epoch()).count();
    auto& bucket = rateLimits_[tenantId];
    if (now - bucket.windowStart >= 60) {
        bucket.windowStart  = now;
        bucket.requestCount = 0;
    }
    return ++bucket.requestCount > MAX_REQUESTS_PER_MINUTE;
}

bool ApiGateway::isRouteAllowed(const std::string& path,
                                 const std::string& role) {
    if (path.find("/admin")   != std::string::npos ||
        path.find("/billing") != std::string::npos)
        return role == "admin" || role == "superadmin";
    if (path.find("/partner") != std::string::npos)
        return role == "partner" || role == "admin";
    return true;
}

void ApiGateway::injectHeaders(const HttpRequestPtr& req) {
    req->addHeader("X-Gateway-Version", "1.0");
    req->addHeader("X-Request-ID",
        std::to_string(std::chrono::steady_clock::now()
            .time_since_epoch().count()));
}
