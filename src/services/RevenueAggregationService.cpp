#include <drogon/drogon.h>
#include "RevenueAggregationService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

double RevenueAggregationService::getDailyRevenue(const std::string& tenantId) {
auto redisClient = drogon::app().getRedisClient("default");
    std::string cacheKey = "revenue:daily:" + tenantId;
    
    try {
        // 1. Try Cache
        auto redisRes = redisClient->execCommandSync<std::string>(
            [](const drogon::nosql::RedisResult &r) { return r.asString(); },
            "GET %s", cacheKey.c_str()
        );
        return std::stod(redisRes);
    } catch (...) {
        // 2. Cache Miss: Calculate from DB
        try {
            auto conn = DatabaseManager::getConnection();
            pqxx::read_transaction txn(*conn);
            
            auto result = txn.exec_params(
                "SELECT COALESCE(SUM(amount), 0) FROM billing_invoices "
                "WHERE tenant_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'PAID'",
                tenantId
            );
            
            double totalRevenue = result[0][0].as<double>();
            
            // 3. Store back in Cache (Expire at midnight)
            redisClient->execCommandAsync(
                [](const drogon::nosql::RedisResult &) {}, [](const std::exception &) {},
                "SETEX %s 86400 %f", cacheKey.c_str(), totalRevenue
            );
            
            return totalRevenue;
        } catch (const std::exception& e) {
            Logger::error("Revenue Aggregation DB Error: " + std::string(e.what()));
            return 0.0;
        }
    }
}

void RevenueAggregationService::incrementDailyRevenue(const std::string& tenantId, double amount) {
auto redisClient = drogon::app().getRedisClient("default");
    std::string cacheKey = "revenue:daily:" + tenantId;
    
    // Atomically increment the cached floating-point value via Redis
    redisClient->execCommandAsync(
        [](const drogon::nosql::RedisResult &) {}, [](const std::exception &) {},
        "INCRBYFLOAT %s %f", cacheKey.c_str(), amount
    );
}