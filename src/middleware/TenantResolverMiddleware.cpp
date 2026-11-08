#include <string>
#include "TenantResolverMiddleware.h"
#include <drogon/HttpRequest.h>
#include <drogon/HttpResponse.h>

std::string TenantResolverMiddleware::resolveTenant(const drogon::HttpRequest& req) {
    std::string tenantId = req.getHeader("X-Tenant-ID");
    if (tenantId.empty()) return "default";
    return tenantId;
}

void TenantResolverMiddleware::doFilter(const drogon::HttpRequestPtr& req,
                                        FilterCallback&&      fcb,
                                        FilterChainCallback&& fccb) {
    std::string tenantId = req->getHeader("X-Tenant-ID");
    if (tenantId.empty()) {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k400BadRequest);
        resp->setBody("Missing X-Tenant-ID header");
        fcb(resp);
        return;
    }
    req->attributes()->insert("tenant_id", tenantId);
    fccb();
}
