#pragma once
#include <drogon/HttpFilter.h>

using namespace drogon;

class SubscriptionGuard : public HttpFilter<SubscriptionGuard> {
public:
    virtual void doFilter(const HttpRequestPtr& req,
                          FilterCallback&& fcb,
                          FilterChainCallback&& fccb) override;
};