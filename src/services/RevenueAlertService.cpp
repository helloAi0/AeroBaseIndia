#include "RevenueAlertService.h"
#include "RevenueAggregationService.h"
#include "EventPublisher.h"
#include "../core/Logger.h"
#include <json/json.h>
#include <string>

void RevenueAlertService::runAnomalyCheck(const std::string& tenantId) {
    double todayRevenue = RevenueAggregationService::getDailyRevenue(tenantId);
    
    // In a production system, fetch the moving average for THIS SPECIFIC HOUR on previous days.
    double expectedRevenueByThisHour = 150000.0; // Mocked expected benchmark
    
    // MAANG Logic: Threshold-based alerting to avoid false alarms
    if (todayRevenue > 0 && todayRevenue < (expectedRevenueByThisHour * 0.50)) {
        
        std::string alertMsg = "CRITICAL: Revenue is 50% below expected benchmark for this hour!";
        core::Logger::critical(alertMsg);
        
        // Publish to WebSocket so the Finance team's screen flashes red
        Json::Value alert;
        alert["type"] = "REVENUE_ANOMALY";
        alert["severity"] = "HIGH";
        alert["message"] = alertMsg;
        
        EventPublisher::publish(tenantId, alert.toStyledString());
    }
}
