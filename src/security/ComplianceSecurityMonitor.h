#pragma once
#include <string>
#include <json/json.h>

class ComplianceSecurityMonitor {
public:
    // Analyzes an action and triggers alerts if suspicious
    static void analyzeActivity(
        const std::string& userId, 
        const std::string& action, 
        const std::string& ip
    );
};