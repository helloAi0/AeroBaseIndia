#pragma once
#include "../config/DatabaseManager.h"
#include "../utils/Logger.h" // Ensure your Logger header is included
#include <exception>

class HealthService {
public:
    static bool databaseHealthy() {
        try {
            // Risky DB operation: Attempting to grab a connection
            auto conn = DatabaseManager::getConnection();
            
            if (conn == nullptr) {
                return false;
            }
            
            return true;
        }
        catch (const std::exception& ex) {
            // 1. Log the exact error for debugging
            Logger::error("Database Health Check Failed: " + std::string(ex.what()));
            
            // 2. Rethrow so the Controller knows something went seriously wrong
            throw;
        }
    }
};