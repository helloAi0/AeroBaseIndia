#include "DigitalTwinController.h"
#include <ctime>

void DigitalTwinController::getTwinState(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    Json::Value root;

    // Get current twin state
    DigitalTwinState twinState = twinService.getState();

    // Format gate data
    root["gates"] = Json::arrayValue;
    for (const auto& gate : twinState.gates) {
        Json::Value gateObj;
        gateObj["gate"] = gate.first;
        gateObj["flight"] = gate.second;
        gateObj["status"] = gate.second;
        root["gates"].append(gateObj);
    }

    // Format passenger zone data
    root["zones"] = Json::arrayValue;
    for (const auto& zone : twinState.zones) {
        Json::Value zoneObj;
        zoneObj["zone"] = zone.first;
        zoneObj["people"] = zone.second;
        root["zones"].append(zoneObj);
    }

    // Weather info
    root["weatherStatus"] = twinState.weatherStatus;
    root["visibilityKm"] = twinState.visibilityKm;
    root["windSpeedKmh"] = twinState.windSpeedKmh;

    // Metadata
    root["timestamp"] = static_cast<Json::Int64>(std::time(nullptr));
    root["system_status"] = "SYNCED";

    callback(HttpResponse::newHttpJsonResponse(root));
}