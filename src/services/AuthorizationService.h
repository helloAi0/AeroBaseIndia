#pragma once
#include "../config/DatabaseManager.h"

class AuthorizationService {
public:
    static bool hasPermission(const std::string& userId,
                              const std::string& permissionName) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        auto result = txn.exec_params(
            "SELECT 1 "
            "FROM user_roles ur "
            "JOIN role_permissions rp ON ur.role_id = rp.role_id "
            "JOIN permissions p ON rp.permission_id = p.id "
            "WHERE ur.user_id = $1 AND p.name = $2",
            userId,
            permissionName
        );

        return !result.empty();
    }
};