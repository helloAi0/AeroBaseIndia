#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Flight.h"
#include <vector>

class FlightRepository {
public:
    /**
     * Checks if a gate is already occupied during the requested time window.
     * Logic: Overlap exists if (Existing_Start < New_End) AND (Existing_End > New_Start)
     */
    static bool hasGateConflict(const std::string& tenantId,
                                const std::string& gate,
                                const std::string& departure,
                                const std::string& arrival) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        auto result = txn.exec_params(
            "SELECT COUNT(*) FROM flights "
            "WHERE tenant_id=$1 AND gate=$2 "
            "AND (departure_time < $4 AND arrival_time > $3)",
            tenantId,
            gate,
            departure,    // $3
            arrival       // $4
        );

        return result[0][0].as<int>() > 0;
    }

    static void createFlight(const Flight& flight) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO flights(id, tenant_id, flight_number, origin, destination, departure_time, arrival_time, gate, status) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            flight.id,
            flight.tenantId,
            flight.flightNumber,
            flight.origin,
            flight.destination,
            flight.departureTime,
            flight.arrivalTime,
            flight.gate,
            flight.status
        );

        txn.commit();
    }

    static std::vector<Flight> getFlightsByTenant(const std::string& tenantId) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        std::vector<Flight> flights;

        auto result = txn.exec_params(
            "SELECT * FROM flights WHERE tenant_id=$1 ORDER BY departure_time",
            tenantId
        );

        for (const auto& row : result) {
            Flight f;
            f.id = row["id"].c_str();
            f.tenantId = row["tenant_id"].c_str();
            f.flightNumber = row["flight_number"].c_str();
            f.origin = row["origin"].c_str();
            f.destination = row["destination"].c_str();
            f.departureTime = row["departure_time"].c_str();
            f.arrivalTime = row["arrival_time"].c_str();
            f.gate = row["gate"].c_str();
            f.status = row["status"].c_str();
            flights.push_back(f);
        }

        return flights;
    }
};