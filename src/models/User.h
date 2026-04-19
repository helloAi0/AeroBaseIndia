#pragma once
#include <string>

struct User {
    std::string id;
    std::string tenantId;
    std::string fullName;
    std::string email;
    std::string passwordHash;
    std::string role;
};