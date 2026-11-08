#include "CompliancePolicyEngine.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

void CompliancePolicyEngine::validateFlightModification(const std::string& flightId) {
    auto conn = DatabaseManager::getConnection();
    pqxx::read_transaction txn(*conn);

    auto result = txn.exec_params(
        "SELECT status, departure_time FROM flights WHERE id = $1", 
        flightId
    );

    if (result.empty()) throw PolicyViolationException("Flight not found");

    std::string status = result[0][0].c_str();
    
    // MAANG Logic: Immutable State Enforcement
    if (status == "Departed" || status == "Arrived") {
        Logger::warn("POLICY BLOCKED: Attempt to modify historical flight " + flightId);
        throw PolicyViolationException("Regulatory Error: Cannot modify a flight after departure.");
    }
}

void CompliancePolicyEngine::validateBookingCapacity(const std::string& flightId, int requestedSeats) {
    auto conn = DatabaseManager::getConnection();
    pqxx::read_transaction txn(*conn);

    // Fetch total capacity and current bookings
    auto result = txn.exec_params(
        "SELECT f.capacity, COALESCE(SUM(b.seat_count), 0) "
        "FROM flights f "
        "LEFT JOIN bookings b ON f.id = b.flight_id "
        "WHERE f.id = $1 GROUP BY f.capacity",
        flightId
    );

    if (result.empty()) throw PolicyViolationException("Flight not found");

    int capacity = result[0][0].as<int>();
    int currentBooked = result[0][1].as<int>();

    // MAANG Logic: Hard constraint against overbooking
    if (currentBooked + requestedSeats > capacity) {
        throw PolicyViolationException("Safety Violation: Aircraft capacity exceeded. Overbooking is strictly prohibited.");
    }
}