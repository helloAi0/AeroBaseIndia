#pragma once
#include <string>

struct Baggage {
    std::string id;
    std::string tenantId;
    std::string passengerId;
    std::string ticketId;
    std::string flightId;
    std::string tagNumber;
    double weight;
    std::string status;
    std::string currentLocation;
};