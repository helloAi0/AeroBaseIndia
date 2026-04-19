#pragma once
#include "../repositories/FlightRepository.h"
#include "../controllers/FlightSocketController.h" // For WebSocket broadcasting
#include "FlightCacheService.h"                    // For Redis caching
#include "AuthService.h"
#include <jsoncpp/json/json.h>
#include <stdexcept>
#include <string>

class FlightService {
public:
    // Existing: Builds the initial flight object with conflict validation
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
     * New: Orchestrates real-time updates across the Cache and WebSockets.
     * This should be called after a successful database update.
     */
    static void updateStatusAndNotify(const std::string& flightId,
                                      const std::string& status,
                                      const std::string& gate) {
        // 1. Update the Fast Cache (Redis) for instant status lookups
        FlightCacheService::updateFlightStatus(flightId, status, gate);

        // 2. Prepare the Real-Time Payload
        Json::Value payload;
        payload["flight_id"] = flightId;
        payload["status"] = status;
        payload["gate"] = gate;

        // 3. Broadcast to all active WebSocket clients (FIDS screens, Staff apps)
        // Using toStyledString() for debugging or toFastString() for performance
        FlightSocketController::broadcast(payload.toStyledString());
    }
};