#include "DigitalTwinService.h"
#include "../core/Logger.h"
#include "../config/DatabaseManager.h"
#include <pqxx/pqxx>
#include <mutex>

static std::mutex s_mutex;
static DigitalTwinState s_state;

DigitalTwinState DigitalTwinService::getState() {
    std::lock_guard<std::mutex> lock(s_mutex);
    return s_state;
}

DigitalTwinState DigitalTwinService::getState(const std::string& tenantId) {
    std::lock_guard<std::mutex> lock(s_mutex);
    s_state.tenantId = tenantId;
    return s_state;
}

Json::Value DigitalTwinService::toJson(const DigitalTwinState& s) {
    Json::Value j;
    j["tenant_id"]      = s.tenantId;
    j["active_flights"] = s.activeFlights;
    j["passengers"]     = s.totalPassengers;
    j["congestion"]     = s.congestionLevel;
    j["weather"]        = s.weatherStatus;
    j["gate_occupancy"] = s.gateOccupancy;
    j["gate_status"]    = s.gateStatus;
    j["visibility_km"]  = s.visibilityKm;
    j["wind_kmh"]       = s.windSpeedKmh;
    Json::Value gates(Json::objectValue);
    for (auto& kv : s.gates) gates[kv.first] = kv.second;
    j["gates"] = gates;
    Json::Value zones(Json::objectValue);
    for (auto& kv : s.zones) zones[kv.first] = kv.second;
    j["zones"] = zones;
    return j;
}

void DigitalTwinService::updateGate(const std::string& gate,
                                     const std::string& flight,
                                     const std::string& status) {
    std::lock_guard<std::mutex> lock(s_mutex);
    s_state.gates[gate]  = flight;
    s_state.gateStatus   = status;
    s_state.gateOccupancy = (int)s_state.gates.size();
    core::Logger::info("[DigitalTwin] Gate " + gate + " -> " + flight + " (" + status + ")");
}

void DigitalTwinService::updateWeather(const std::string& tenantId,
                                        const std::string& weather) {
    std::lock_guard<std::mutex> lock(s_mutex);
    s_state.weatherStatus = weather;
    core::Logger::info("[DigitalTwin] Weather=" + weather + " tenant=" + tenantId);
}

void DigitalTwinService::updateWeather(const std::string& tenantId,
                                        float visibilityKm,
                                        float windSpeedKmh) {
    std::lock_guard<std::mutex> lock(s_mutex);
    s_state.visibilityKm  = visibilityKm;
    s_state.windSpeedKmh  = windSpeedKmh;
    core::Logger::info("[DigitalTwin] Weather updated for " + tenantId);
}

void DigitalTwinService::updateState(const std::string& tenantId,
                                      const Json::Value& event) {
    core::Logger::info("[DigitalTwin] State update for " + tenantId);
}
