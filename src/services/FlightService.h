#pragma once
#include "../repositories/FlightRepository.h"
#include "../controllers/FlightSocketController.h" 
#include "FlightCacheService.h"                    
#include "AuthService.h"
#include "AuditService.h"
#include "EventPublisher.h" // Added for terminal notifications
#include <jsoncpp/json/json.h>
#include <stdexcept>
#include <string>

class FlightService {
public:
    static Flight buildFlight(const std::string& tenantId,
                              const std::string& number,
                              const std::string& origin,
                              const std::string& destination,
                              const std::string& departure,
                              const std::string& arrival,
                              const std::string& gate) {
        
        if (FlightRepository::hasGateConflict(tenantId, gate, departure, arrival)) {
            throw std::runtime_error("Gate conflict detected");
        }

        Flight flight;
        flight.id = AuthService::generateUUID();
        flight.tenantId = tenantId;
        flight.flightNumber = number;
        flight.origin = origin;
        flight.destination = destination;
        flight.departureTime = departure;
        flight.arrivalTime = arrival;
        flight.gate = gate;
        flight.status = "Scheduled";

        return flight;
    }

    /**
     * Orchestrates the update, the audit log, the cache, and real-time alerts.
     */
    static void updateStatusAndNotify(const std::string& tenantId,
                                      const std::string& userId,
                                      const std::string& flightId,
                                      const std::string& newStatus,
                                      const std::string& newGate,
                                      const std::string& ipAddress) {
        
        // 1. Fetch current state for the "Before" snapshot
        auto oldFlight = FlightRepository::getById(tenantId, flightId);
        if (!oldFlight) throw std::runtime_error("Flight not found");

        // 2. Perform Persistent Database Update
        FlightRepository::updateStatus(tenantId, flightId, newStatus, newGate);

        // 3. Construct and Submit Audit Log
        AuditLog log;
        log.id = AuthService::generateUUID();
        log.tenantId = tenantId;
        log.userId = userId;
        log.action = "STATUS_UPDATE";
        log.entityType = "FLIGHT";
        log.entityId = flightId;
        
        log.oldData = "{\"status\":\"" + oldFlight->status + "\",\"gate\":\"" + oldFlight->gate + "\"}";
        log.newData = "{\"status\":\"" + newStatus + "\",\"gate\":\"" + newGate + "\"}";
        log.ipAddress = ipAddress;

        AuditService::log(log);

        // 4. Update the Fast Cache (Redis)
        FlightCacheService::updateFlightStatus(flightId, newStatus, newGate);

        // 5. Gate Change Specific Notification
        // Only publish if the gate actually moved
        if (oldFlight->gate != newGate) {
            std::string gateEvent =
                "{\"type\":\"GATE_CHANGED\","
                "\"flight_id\":\"" + flightId + "\","
                "\"gate\":\"" + newGate + "\"}";

            EventPublisher::publish(gateEvent);
        }

        // 6. General Broadcast to WebSockets (FIDS screens)
        Json::Value payload;
        payload["flight_id"] = flightId;
        payload["status"] = newStatus;
        payload["gate"] = newGate;
        FlightSocketController::broadcast(payload.toFastString());
    }
};