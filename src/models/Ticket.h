#pragma once
#include <string>

struct Ticket {
    std::string id;
    std::string tenantId;
    std::string passengerId;
    std::string flightId;
    std::string seatNumber;
    std::string bookingStatus;
    double ticketPrice;
};