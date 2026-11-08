#include "GateProfitabilityService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

double GateProfitabilityService::calculateRevenuePerGateHour(const std::string& gateId, const std::string& tenantId) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        // Fetch Total Revenue linked to this gate
        auto revResult = txn.exec_params(
            "SELECT COALESCE(SUM(amount), 0) FROM billing_invoices "
            "WHERE gate_id = $1 AND tenant_id = $2 AND status = 'PAID'",
            gateId, tenantId
        );
        double totalRevenue = revResult[0][0].as<double>();

        // Fetch Total Occupancy Hours (Mocked DB schema assumption)
        auto timeResult = txn.exec_params(
            "SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (departure_time - arrival_time))/3600), 0) "
            "FROM flights WHERE gate = $1 AND tenant_id = $2",
            gateId, tenantId
        );
        double occupiedHours = timeResult[0][0].as<double>();

        // MAANG Logic: Defensive Math
        // Protect against Division by Zero (e.g., brand new gate with no flights yet)
        if (occupiedHours <= 0.0) {
            Logger::warn("Gate Profitability: Division by zero avoided for gate " + gateId);
            return 0.0; 
        }

        return totalRevenue / occupiedHours;

    } catch (const std::exception& e) {
        Logger::error("Gate Profitability Error: " + std::string(e.what()));
        return 0.0;
    }
}