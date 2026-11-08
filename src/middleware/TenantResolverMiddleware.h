#pragma once
#include <drogon/HttpFilter.h>
#include <string>

using namespace drogon;

class TenantResolverMiddleware : public HttpFilter<TenantResolverMiddleware> {
public:
    void doFilter(const HttpRequestPtr& req,
                  FilterCallback&&     fcb,
                  FilterChainCallback&& fccb) override;

    static std::string resolveTenant(const HttpRequest& req);
};