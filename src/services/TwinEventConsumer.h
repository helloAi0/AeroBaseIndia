#pragma once
#include "DigitalTwinService.hpp"
#include <string>

// Structure to represent incoming flight events
struct FlightEvent {
    std::string flightNumber;
    std::string gate;
    std::string status;
};

class TwinEventConsumer {
private:
    DigitalTwinService& twinService;

public:
    // Pass the TwinService by reference to ensure we update the same global state
    TwinEventConsumer(DigitalTwinService& service) : twinService(service) {}

    void onFlightUpdate(const FlightEvent& event);
    void onGateMaintenance(const std::string& gateId);
};