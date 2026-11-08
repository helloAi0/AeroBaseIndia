#pragma once
#include <drogon/HttpFilter.h>
#include <string>
#include <unordered_map>

using namespace drogon;

// Rate limit bucket per tenant
struct RateLimitBucket {
    int  requestCount = 0;
    long windowStart  = 0;
};

class ApiGateway : public HttpFilter<ApiGateway> {
public:
    void doFilter(const HttpRequestPtr&  req,
                  FilterCallback&&       fcb,
                  FilterChainCallback&&  fccb) override;

private:
    static bool   isRateLimited(const std::string& tenantId);
    static bool   isRouteAllowed(const std::string& path,
                                 const std::string& role);
    static void   injectHeaders(const HttpRequestPtr& req);

    static std::unordered_map<std::string, RateLimitBucket> rateLimits_;
    static const int MAX_REQUESTS_PER_MINUTE = 100;
};
