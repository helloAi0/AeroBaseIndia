#pragma once
#include <string>
#include <json/json.h>

class RevenueForecastEngine {
public:
    // Returns a forecast object containing expected, best-case, and worst-case scenarios
    static Json::Value predictNextMonth(const std::string& tenantId);
};