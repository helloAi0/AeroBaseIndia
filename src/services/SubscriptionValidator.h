#pragma once
#include "../config/DatabaseManager.h"
#include <stdexcept>
#include <string>

class SubscriptionValidator {
public:
    static void validateFlightLimit(const std::string& tenantId) {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        // 1. Get the limit and current count in one query for efficiency
        auto result = txn.exec_params(
            "SELECT p.max_flights, "
            "(SELECT COUNT(*) FROM usage_metrics m "
            " WHERE m.tenant_id = $1 AND m.metric_name = 'FLIGHT_CREATED' "
            " AND m.created_at >= date_trunc('month', CURRENT_DATE)) as current_count "
            "FROM tenants t "
            "JOIN subscription_plans p ON t.subscription_plan = p.id "
            "WHERE t.id = $1",
            tenantId
        );

        if (result.empty()) throw std::runtime_error("Subscription data not found");

        int maxFlights = result[0][0].as<int>();
        int currentCount = result[0][1].as<int>();

        if (currentCount >= maxFlights) {
            throw std::runtime_error("Plan limit exceeded: Upgrade your plan to add more flights.");
        }
    }
};