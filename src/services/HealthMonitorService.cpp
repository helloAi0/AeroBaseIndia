#include "HealthMonitorService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <drogon/drogon.h>

bool HealthMonitorService::checkDatabase() {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::nontransaction txn(*conn);
        txn.exec("SELECT 1"); // Simplest, fastest query
        return true;
    } catch (...) {
        return false;
    }
}

bool HealthMonitorService::checkRedisCache() {
    // Assuming Drogon's RedisClient is configured
    try {
auto redisClient = drogon::app().getRedisClient("default");
        // A real implementation would execute a PING command asynchronously
        return redisClient != nullptr; 
    } catch (...) {
        return false;
    }
}

bool HealthMonitorService::checkAIEngine() {
    // In production, use drogon::HttpClient to ping the Python Flask /health endpoint
    // For this implementation, we return a mocked success
    return true; 
}

Json::Value HealthMonitorService::getSystemHealth() {
    Json::Value health;

    health["redis"] = checkRedisCache() ? "UP" : "DOWN";
    health["ai_engine"] = checkAIEngine() ? "UP" : "DOWN";
    health["timestamp"] = (Json::Int64)std::time(nullptr);
    return health;
}

bool HealthMonitorService::isNodeHealthy() {
    bool db = checkDatabase();
    bool redis = checkRedisCache();
    bool ai = checkAIEngine();

    if (!db || !redis || !ai) {

        return false;
    }
    return true;
}