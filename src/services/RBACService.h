#pragma once
#include <string>
#include <unordered_map>
#include <vector>
#include <algorithm>

class RBACService {
public:
    static bool hasPermission(const std::string& role, const std::string& permission) {
        // Define which roles have which permissions
        static std::unordered_map<std::string, std::vector<std::string>> rolePermissions = {
            {"admin", {"MANAGE_FLIGHTS", "MANAGE_USERS", "VIEW_REPORTS"}},
            {"staff", {"VIEW_FLIGHTS", "UPDATE_BAGGAGE"}},
            {"gate_agent", {"MANAGE_FLIGHTS", "VIEW_FLIGHTS"}}
        };

        auto it = rolePermissions.find(role);
        if (it != rolePermissions.end()) {
            const auto& permissions = it->second;
            return std::find(permissions.begin(), permissions.end(), permission) != permissions.end();
        }
        
        return false;
    }
};