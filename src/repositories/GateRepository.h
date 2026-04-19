#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Gate.h"
#include <vector>

class GateRepository {
public:
    static std::vector<Gate> getAllAvailableGates(const std::string& tenantId) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        std::vector<Gate> gates;

        auto result = txn.exec_params(
            "SELECT * FROM gates WHERE tenant_id=$1 AND status='Available'",
            tenantId
        );

        for (const auto& row : result) {
            Gate g;
            g.id = row["id"].c_str();
            g.tenantId = row["tenant_id"].c_str();
            g.terminal = row["terminal"].c_str();
            g.gateCode = row["gate_code"].c_str();
            g.status = row["status"].c_str();
            gates.push_back(g);
        }

        return gates;
    }

    static void updateGateStatus(const std::string& gateId,
                                 const std::string& status) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "UPDATE gates SET status=$1 WHERE id=$2",
            status,
            gateId
        );

        txn.commit();
    }
};