#include "UsageMeteringService.h"
#include "../core/Logger.h"
#include <drogon/drogon.h>

void UsageMeteringService::recordApiCall(const std::string& tenantId) {
auto redisClient = drogon::app().getRedisClient("default");
    // Key format: usage:tenant_id:metric_name:YYYY-MM
    std::string currentMonth = "2026-04"; // In reality, generate dynamically
    std::string cacheKey = "usage:" + tenantId + ":api_calls:" + currentMonth;

    // Atomic increment in Redis (Extremely fast, non-blocking)
    redisClient->execCommandAsync(
        [](const drogon::nosql::RedisResult &) {}, 
        [](const std::exception &err) {
            Logger::error("Failed to meter API call: " + std::string(err.what()));
        },
        "INCR %s", cacheKey.c_str()
    );
}

void UsageMeteringService::recordAIPrediction(const std::string& tenantId) {
auto redisClient = drogon::app().getRedisClient("default");
    std::string currentMonth = "2026-04"; 
    std::string cacheKey = "usage:" + tenantId + ":ai_predictions:" + currentMonth;

    redisClient->execCommandAsync(
        [](const drogon::nosql::RedisResult &) {}, [](const std::exception &) {},
        "INCR %s", cacheKey.c_str()
    );
}