#pragma once
#include <string>

struct Flight {
    std::string id;
    std::string tenantId;
    std::string flightNumber;
    std::string origin;
    std::string destination;
    std::string departureTime;
    std::string arrivalTime;
    std::string gate;
    std::string status;
};