#pragma once
#include <string>
#include <stdexcept>
#include <json/json.h>

// Custom Exception for Policy Violations
class PolicyViolationException : public std::runtime_error {
public:
    PolicyViolationException(const std::string& msg) : std::runtime_error(msg) {}
};

class CompliancePolicyEngine {
public:
    // Throws PolicyViolationException if rules fail
    static void validateFlightModification(const std::string& flightId);
    static void validateBookingCapacity(const std::string& flightId, int requestedSeats);
};