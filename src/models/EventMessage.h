#pragma once
#include <string>

struct EventMessage {
    std::string tenantId;
    std::string eventType;
    std::string entityId;
    std::string payload;
};
