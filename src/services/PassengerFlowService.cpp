#include <mutex>
#include <shared_mutex>
#include "PassengerFlowService.hpp"
#include "../services/EventPublisher.h"
#include "../core/Logger.h"

PassengerFlowService::PassengerFlowService() {
    // Initialize standard airport zones with safety thresholds
    heatMap["Security"] = {0, 200, "LOW"};
    heatMap["Immigration"] = {0, 150, "LOW"};
    heatMap["Boarding"] = {0, 500, "LOW"};
    heatMap["Baggage Claim"] = {0, 300, "LOW"};
    heatMap["Food Court"] = {0, 400, "LOW"};
}

void PassengerFlowService::updateZoneCount(const std::string& zone, int count) {
    std::unique_lock<std::shared_mutex> lock(flowMutex);
    
    if (heatMap.find(zone) == heatMap.end()) return;

    ZoneData& data = heatMap[zone];
    data.currentCount = count;

    // MAANG Logic: Automated Congestion Analysis
    float occupancy = (float)count / data.capacityThreshold;
    std::string oldRisk = data.riskLevel;

    if (occupancy > 0.9) data.riskLevel = "HIGH";
    else if (occupancy > 0.7) data.riskLevel = "MEDIUM";
    else data.riskLevel = "LOW";

    // Trigger alert only if risk level changes (to avoid spamming)
    if (data.riskLevel != oldRisk && data.riskLevel == "HIGH") {
        Logger::warn("CONGESTION ALERT: Zone " + zone + " is at critical capacity!");
        EventPublisher::publish("OPS_TEAM", "{\"type\":\"ZONE_CROWDED\",\"zone\":\"" + zone + "\"}");
    }
}

std::unordered_map<std::string, ZoneData> PassengerFlowService::getFullHeatmap() const {
    std::shared_lock<std::shared_mutex> lock(flowMutex);
    return heatMap;
}