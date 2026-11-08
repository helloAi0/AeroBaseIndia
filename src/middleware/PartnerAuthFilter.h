#pragma once
#include <drogon/HttpFilter.h>

using namespace drogon;

class PartnerAuthFilter : public HttpFilter<PartnerAuthFilter> {
public:
    virtual void doFilter(const HttpRequestPtr& req,
                          FilterCallback&& fcb,
                          FilterChainCallback&& fccb) override;
};