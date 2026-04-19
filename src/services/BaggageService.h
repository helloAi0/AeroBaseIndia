#pragma once
#include "../repositories/BaggageRepository.h"
#include "AuthService.h"
#include <sstream>

class BaggageService {
public:
    static std::string generateTag(const std::string& flightNumber,
                                   int sequence) {
        std::stringstream ss;
        ss << flightNumber << "-" << sequence;
        return ss.str();
    }

    static Baggage createBag(const std::string& tenantId,
                             const std::string& passengerId,
                             const std::string& ticketId,
                             const std::string& flightId,
                             const std::string& flightNumber,
                             double weight,
                             int sequence) {
        Baggage bag;
        bag.id = AuthService::generateUUID();
        bag.tenantId = tenantId;
        bag.passengerId = passengerId;
        bag.ticketId = ticketId;
        bag.flightId = flightId;
        bag.tagNumber = generateTag(flightNumber, sequence);
        bag.weight = weight;
        bag.status = "Checked-In";
        bag.currentLocation = "Check-In Counter";
        return bag;
    }
};