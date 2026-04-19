#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Staff.h"

class StaffRepository {
public:
    static void createStaff(const Staff& s) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO staff(id, tenant_id, full_name, email, password_hash, role, department) "
            "VALUES($1,$2,$3,$4,$5,$6,$7)",
            s.id, s.tenantId, s.fullName, s.email,
            s.passwordHash, s.role, s.department
        );

        txn.commit();
    }
};