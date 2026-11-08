#pragma once

#include "../config/DatabaseManager.h"
#include "../models/Invoice.h"
#include <json/json.h>
#include <string>

class BillingRepository {
public:
    static void createInvoice(const Invoice& invoice) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO invoices(id, tenant_id, subscription_id, amount, currency, status, due_at) "
            "VALUES($1, $2, $3, $4, $5, $6, $7)",
            invoice.id,
            invoice.tenantId,
            invoice.subscriptionId,
            invoice.amount,
            invoice.currency,
            invoice.status,
            invoice.dueAt
        );

        txn.commit();
    }

    static Json::Value getSubscriptionInfo(const std::string& tenantId) {
        Json::Value result;
        result["tenant_id"] = tenantId;
        result["plan"] = "STANDARD";
        result["status"] = "ACTIVE";
        return result;
    }

    static void updatePlan(const std::string& tenantId, const std::string& newPlan) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "UPDATE tenant_subscriptions SET plan_id = $2 WHERE tenant_id = $1",
            tenantId,
            newPlan
        );

        txn.commit();
    }
};