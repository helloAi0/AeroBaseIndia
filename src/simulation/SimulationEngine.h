#pragma once
#include <string>
#include <json/json.h>

class SimulationEngine {
public:
    // Run a scenario and return simulation result as JSON
    static Json::Value runScenario(const std::string& tenantId, const Json::Value& params);
};