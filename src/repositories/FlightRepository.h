#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Flight.h"
#include <vector>
#include <optional> // Required for safe "not found" handling

class FlightRepository {
public:
    /**
     * Checks for gate scheduling overlaps.
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
            tenantId, gate, departure, arrival
        );

        return result[0][0].as<int>() > 0;
    }

    /**
     * Finds a single flight. Enforces tenant_id for security isolation.
     */
    static std::optional<Flight> getById(const std::string& tenantId, const std::string& flightId) {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        auto result = txn.exec_params(
            "SELECT id, tenant_id, flight_number, origin, destination, "
            "departure_time, arrival_time, gate, status FROM flights "
            "WHERE tenant_id=$1 AND id=$2",
            tenantId, flightId
        );

        if (result.empty()) return std::nullopt;

        const auto& row = result[0];
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

        return f;
    }

    /**
     * Persists status and gate changes to the database.
     */
    static void updateStatus(const std::string& tenantId, 
                             const std::string& flightId, 
                             const std::string& status, 
                             const std::string& gate) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "UPDATE flights SET status=$3, gate=$4 "
            "WHERE tenant_id=$1 AND id=$2",
            tenantId, flightId, status, gate
        );

        txn.commit();
    }

    static void createFlight(const Flight& flight) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO flights(id, tenant_id, flight_number, origin, destination, departure_time, arrival_time, gate, status) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            flight.id, flight.tenantId, flight.flightNumber,
            flight.origin, flight.destination, flight.departureTime,
            flight.arrivalTime, flight.gate, flight.status
        );

        txn.commit();
    }

    static std::vector<Flight> getFlightsByTenant(const std::string& tenantId) {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

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