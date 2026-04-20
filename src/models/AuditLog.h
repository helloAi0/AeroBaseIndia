#pragma once
#include <string>

struct AuditLog {
    std::string id;
    std::string tenantId;
    std::string userId;
    std::string action;
    std::string entityType;
    std::string entityId;
    std::string oldData;
    std::string newData;
    std::string ipAddress;
};