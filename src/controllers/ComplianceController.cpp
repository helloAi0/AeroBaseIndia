#include "ComplianceController.h"
#include "../config/DatabaseManager.h"

void ComplianceController::getSummary(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        // 1. Aggregate metrics from Audit and Security tables
        auto auditCount = txn.exec("SELECT COUNT(*) FROM compliance_audit WHERE created_at > CURRENT_DATE")[0][0].as<int>();
        
        // Mocking incident data logic
        int alerts = 2; 
        int incidents = 1;
        
        // 2. MAANG Logic: Calculate a dynamic Compliance Score
        // Score starts at 100 and drops for every security alert or open incident
        int complianceScore = 100 - (alerts * 2) - (incidents * 5);
        if (complianceScore < 0) complianceScore = 0;

        Json::Value res;
        res["audit_events_today"] = auditCount;
        res["security_alerts"] = alerts;
        res["incidents_open"] = incidents;
        res["compliance_score"] = complianceScore;
        res["status"] = (complianceScore > 90) ? "OPTIMAL ✅" : "ATTENTION REQUIRED ⚠️";

        callback(HttpResponse::newHttpJsonResponse(res));
    } catch (const std::exception& e) {
        Json::Value err;
        err["error"] = "Failed to fetch compliance summary";
        callback(HttpResponse::newHttpJsonResponse(err));
    }
}