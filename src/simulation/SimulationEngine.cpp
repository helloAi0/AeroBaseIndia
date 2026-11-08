#include "SimulationEngine.h"

Json::Value SimulationEngine::runScenario(const std::string& tenantId, const Json::Value& params) {
    Json::Value result;
    result["tenant_id"]          = tenantId;
    result["simulated_delay_min"]= params.get("delay_factor", 1.0).asDouble() * 12.0;
    result["gate_pressure"]      = params.get("gate_count", 10).asInt() > 8 ? "HIGH" : "NORMAL";
    result["status"]             = "simulation_complete";
    return result;
}