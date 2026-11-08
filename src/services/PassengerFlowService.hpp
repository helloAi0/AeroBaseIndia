#pragma once
#include <string>
#include <unordered_map>
#include <shared_mutex>
#include <vector>

struct ZoneData {
    int currentCount;
    int capacityThreshold;
    std::string riskLevel; // LOW, MEDIUM, HIGH
};

class PassengerFlowService {
private:
    std::unordered_map<std::string, ZoneData> heatMap;
    mutable std::shared_mutex flowMutex;

public:
    PassengerFlowService();
    
    void updateZoneCount(const std::string& zone, int count);
    std::unordered_map<std::string, ZoneData> getFullHeatmap() const;
};