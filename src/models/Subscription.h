#pragma once
#include <string>

struct Subscription {
    std::string id;
    std::string tenantId;
    std::string planId;
    std::string status;
    std::string startsAt;
    std::string expiresAt;
};