#pragma once

#include <json/json.h>
#include <string>

class RevenueRecommendationEngine {
public:
    static Json::Value generateInsights(const std::string& tenantId);
};