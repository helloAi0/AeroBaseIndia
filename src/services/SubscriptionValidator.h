#pragma once
#include <string>

class SubscriptionValidator {
public:
    static bool canCreateFlight(int currentFlights,
                                int maxFlights) {
        return currentFlights < maxFlights;
    }
};