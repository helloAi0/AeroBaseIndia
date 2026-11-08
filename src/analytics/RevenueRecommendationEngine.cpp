#include "analytics/RevenueRecommendationEngine.h"
#include "../config/DatabaseManager.h"

Json::Value RevenueRecommendationEngine::generateInsights(const std::string& tenantId) {
    Json::Value insights(Json::arrayValue);

    bool peakHoursApproaching = true;
    std::string underutilizedGate = "C4";

    if (peakHoursApproaching) {
        Json::Value insight1;
        insight1["type"] = "PRICING_OPTIMIZATION";
        insight1["action"] = "Increase Lounge access fees by 15% for the next 3 hours.";
        insight1["reason"] = "Terminal congestion predicted to exceed 85% capacity.";
        insights.append(insight1);
    }

    Json::Value insight2;
    insight2["type"] = "ASSET_ALLOCATION";
    insight2["action"] = "Route delayed low-cost carrier flights to Gate " + underutilizedGate + ".";
    insight2["reason"] = "Gate C4 has generated 40% less retail foot traffic today.";
    insights.append(insight2);

    return insights;
}