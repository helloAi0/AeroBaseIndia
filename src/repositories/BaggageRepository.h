#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Baggage.h"

class BaggageRepository {
public:
    static void createBaggage(const Baggage& bag) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO baggage(id, tenant_id, passenger_id, ticket_id, flight_id, tag_number, weight, status, current_location) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            bag.id,
            bag.tenantId,
            bag.passengerId,
            bag.ticketId,
            bag.flightId,
            bag.tagNumber,
            bag.weight,
            bag.status,
            bag.currentLocation
        );

        txn.commit();
    }

    static void updateStatus(const std::string& tag,
                             const std::string& status,
                             const std::string& location) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "UPDATE baggage SET status=$1, current_location=$2 WHERE tag_number=$3",
            status,
            location,
            tag
        );

        txn.commit();
    }
};