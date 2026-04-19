#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Passenger.h"

class PassengerRepository {
public:
    static void createPassenger(const Passenger& p) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO passengers(id, tenant_id, first_name, last_name, passport_number, nationality, date_of_birth, phone, email) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            p.id,
            p.tenantId,
            p.firstName,
            p.lastName,
            p.passportNumber,
            p.nationality,
            p.dateOfBirth,
            p.phone,
            p.email
        );

        txn.commit();
    }
};