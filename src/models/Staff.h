#pragma once
#include <string>

struct Staff {
    std::string id;
    std::string tenantId;
    std::string fullName;
    std::string email;
    std::string passwordHash;
    std::string role;
    std::string department;
    bool isActive;
};