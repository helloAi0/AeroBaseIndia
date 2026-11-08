#pragma once
#include <string>

class RevenueAlertService {
public:
    static void checkAndAlert(const std::string& tenantId, double revenue);
    static void sendAlert(const std::string& tenantId, const std::string& message);
    static void runAnomalyCheck(const std::string& tenantId);
};
