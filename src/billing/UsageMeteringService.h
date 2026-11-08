#pragma once
#include <string>

class UsageMeteringService {
public:
    // High-speed counters (Fire and forget)
    static void recordApiCall(const std::string& tenantId);
    static void recordAIPrediction(const std::string& tenantId);
    static void recordPassengerProcessed(const std::string& tenantId, int count = 1);
};