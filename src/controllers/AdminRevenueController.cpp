#include "AdminRevenueController.h"
#include "../services/JwtService.h"
#include "../config/DatabaseManager.h"

void AdminRevenueController::getGlobalMetrics(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    try {
        // 1. Hardcoded Security: ONLY the Master Admin can view this
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        if (decoded.get_payload_claim("role").as_string() != "SYSTEM_OWNER") {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k403Forbidden);
            callback(resp);
            return;
        }

        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        Json::Value metrics;

        // Metric 1: Monthly Recurring Revenue (MRR) - Sum of all finalized invoices this month
        auto mrrRes = txn.exec("SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status IN ('FINALIZED', 'PAID') AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)");
        metrics["monthly_mrr"] = mrrRes[0][0].as<double>();

        // Metric 2: Active Airports (Tenants)
        auto tenantRes = txn.exec("SELECT COUNT(*) FROM tenants WHERE status = 'ACTIVE'");
        metrics["active_airports"] = tenantRes[0][0].as<int>();

        // Metric 3: Enterprise Accounts
        auto entRes = txn.exec("SELECT COUNT(*) FROM tenant_subscriptions WHERE plan_tier = 'ENTERPRISE'");
        metrics["enterprise_accounts"] = entRes[0][0].as<int>();

        // Metric 4: Pending / Overdue Invoices (Cash flow risk)
        auto pendingRes = txn.exec("SELECT COUNT(*) FROM invoices WHERE status = 'FINALIZED' AND due_date < CURRENT_DATE");
        metrics["pending_invoices"] = pendingRes[0][0].as<int>();

        callback(HttpResponse::newHttpJsonResponse(metrics));

    } catch (...) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
    }
}