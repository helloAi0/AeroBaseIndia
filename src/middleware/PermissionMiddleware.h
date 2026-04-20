#pragma once
#include <drogon/drogon.h>
#include "../services/AuthorizationService.h"

using namespace drogon;

class PermissionMiddleware {
public:
    static bool validate(const std::string& userId,
                         const std::string& permission) {
        return AuthorizationService::hasPermission(userId, permission);
    }
};