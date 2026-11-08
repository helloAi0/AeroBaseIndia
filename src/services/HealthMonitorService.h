#pragma once
#include <string>
#include <json/json.h>

class HealthMonitorService {
public:
    // Returns a detailed JSON report of component health
    static Json::Value getSystemHealth();
    
    // Returns true only if ALL critical components are functional
    static bool isNodeHealthy();

private:
    static bool checkDatabase();
    static bool checkRedisCache();
    static bool checkAIEngine();
};