#pragma once
#include <string>

struct AuditLog {
    std::string id;
    std::string tenantId;
    std::string staffId;
    std::string action;
    std::string entityType;
    std::string entityId;
};