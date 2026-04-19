#pragma once
#include "../config/DatabaseManager.h"
#include "../models/Invoice.h"

class BillingRepository {
public:
    static void createInvoice(const Invoice& invoice) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO invoices(id, tenant_id, subscription_id, amount, currency, status, due_at) "
            "VALUES($1,$2,$3,$4,$5,$6,$7)",
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
};