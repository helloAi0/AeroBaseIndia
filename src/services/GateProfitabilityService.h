#pragma once
#include <string>

class GateProfitabilityService {
public:
    static double calculateRevenuePerGateHour(const std::string& gateId, const std::string& tenantId);
};