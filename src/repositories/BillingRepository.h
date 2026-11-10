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
        try {
            auto conn = DatabaseManager::getConnection();
            pqxx::read_transaction txn(*conn);
            auto r = txn.exec_params(
                "SELECT COALESCE(plan_tier,'STANDARD'), COALESCE(status,'ACTIVE'), "
                "COALESCE(to_char(COALESCE(valid_until, expires_at),'YYYY-MM-DD'),'') "
                "FROM tenant_subscriptions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1", tenantId);
            if (!r.empty()) {
                result["plan"] = r[0][0].c_str(); result["status"] = r[0][1].c_str();
                result["renews_on"] = r[0][2].c_str();
            }
        } catch (...) {}
        return result;
    }

    // Throws std::invalid_argument for an unknown plan name.
    static void updatePlan(const std::string& tenantId, const std::string& newPlan) {
        static const char* allowed[] = {"STARTER", "BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"};
        bool ok = false;
        for (auto a : allowed) if (newPlan == a) ok = true;
        if (!ok) throw std::invalid_argument("Unknown plan");

        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        auto u = txn.exec_params(
            "UPDATE tenant_subscriptions SET plan_tier = $2, status = 'ACTIVE' WHERE tenant_id = $1", tenantId, newPlan);
        if (u.affected_rows() == 0) {
            txn.exec_params(
                "INSERT INTO tenant_subscriptions (tenant_id, plan_tier, status, starts_at, expires_at, valid_until) "
                "VALUES ($1, $2, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days')",
                tenantId, newPlan);
        }
        txn.commit();
    }
};