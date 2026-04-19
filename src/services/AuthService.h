#pragma once
#include "../config/DatabaseManager.h"
#include "PasswordService.h"
#include "JwtService.h"
#include <uuid/uuid.h>
#include <string>
#include <stdexcept>

class AuthService {
public:
    /**
     * Generates a unique UUID for database records.
     */
    static std::string generateUUID() {
        uuid_t uuid;
        uuid_generate(uuid);
        char uuidStr[37];
        uuid_unparse(uuid, uuidStr);
        return std::string(uuidStr);
    }

    /**
     * Registers a new airport (tenant) and its primary administrator.
     */
    static void registerAirport(const std::string& airportName,
                                const std::string& airportCode,
                                const std::string& adminName,
                                const std::string& email,
                                const std::string& password) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        std::string tenantId = generateUUID();
        std::string userId = generateUUID();
        std::string hashed = PasswordService::hashPassword(password);

        txn.exec_params(
            "INSERT INTO tenants(id, airport_name, airport_code, subscription_plan) VALUES($1,$2,$3,$4)",
            tenantId, airportName, airportCode, "starter"
        );

        txn.exec_params(
            "INSERT INTO users(id, tenant_id, full_name, email, password_hash, role) VALUES($1,$2,$3,$4,$5,$6)",
            userId, tenantId, adminName, email, hashed, "admin"
        );

        txn.commit();
    }

    /**
     * Authenticates a user and returns a JWT token containing their identity and tenant info.
     */
    static std::string login(const std::string& email,
                             const std::string& password) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        // Fetch user data including their tenant_id for multi-tenancy isolation
        auto result = txn.exec_params(
            "SELECT id, tenant_id, password_hash, role FROM users WHERE email=$1",
            email
        );

        if (result.empty()) {
            throw std::runtime_error("User not found");
        }

        std::string userId = result[0]["id"].c_str();
        std::string tenantId = result[0]["tenant_id"].c_str();
        std::string storedHash = result[0]["password_hash"].c_str();
        std::string role = result[0]["role"].c_str();

        // Verify password
        std::string incomingHash = PasswordService::hashPassword(password);

        if (storedHash != incomingHash) {
            throw std::runtime_error("Invalid password");
        }

        // Return a signed JWT token
        return JwtService::generateToken(userId, tenantId, role);
    }
};