#include "TwinEventConsumer.h"
#include "../realtime/TwinWebSocket.h"  // fixed relative path
#include "../core/Logger.h"
#include <string>

void TwinEventConsumer::onFlightUpdate(const FlightEvent& event) {
    Logger::info("Syncing Event to Twin: " + event.flightNumber + " at Gate " + event.gate);
    
    // 1. MAANG Logic: Mapping physical status to Twin-specific visualizations
    std::string twinStatus = event.status;
    if (event.status == "Delayed") {
        twinStatus = "⚠️ DELAYED";
    } else if (event.status == "Boarding") {
        twinStatus = "⚡ ACTIVE_BOARDING";
    }

    // 2. Update the Digital Twin service (Thread-safe state update)
    twinService.updateGate(event.gate, event.flightNumber, twinStatus);

    // 3. Real-Time Push: Broadcast the update to all active WebSockets
    // We include the twinStatus so the frontend gets the emoji/indicator immediately
    std::string updateJson = 
        "{\"type\":\"GATE_UPDATE\","
        "\"gate\":\"" + event.gate + "\","
        "\"flight\":\"" + event.flightNumber + "\","
        "\"status\":\"" + twinStatus + "\"}";

    TwinWebSocket::broadcastUpdate(updateJson);
}

void TwinEventConsumer::onGateMaintenance(const std::string& gateId) {
    Logger::warn("Twin Sync: Gate " + gateId + " entered Maintenance Mode.");
    
    std::string maintenanceStatus = "🛠️ UNDER_REPAIR";
    
    // Update State
    twinService.updateGate(gateId, "NONE", maintenanceStatus);

    // Broadcast Maintenance Update
    std::string updateJson = 
        "{\"type\":\"GATE_MAINTENANCE\","
        "\"gate\":\"" + gateId + "\","
        "\"status\":\"" + maintenanceStatus + "\"}";

    TwinWebSocket::broadcastUpdate(updateJson);
}
