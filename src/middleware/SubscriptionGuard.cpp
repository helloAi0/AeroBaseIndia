#include "SubscriptionGuard.h"
#include "../services/JwtService.h"
#include "../config/DatabaseManager.h"

void SubscriptionGuard::doFilter(const HttpRequestPtr& req, FilterCallback&& fcb, FilterChainCallback&& fccb) {
    try {
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();

        // 1. Identify which feature the user is trying to access
        std::string requiredFeature = req->attributes()->get<std::string>("required_feature");

        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        
        // 2. Fetch the tenant's current plan and grace period status
        auto result = txn.exec_params(
            "SELECT features, status, valid_until FROM tenant_subscriptions WHERE tenant_id = $1", 
            tenantId
        );

        if (result.empty()) throw std::runtime_error("No subscription found");

        std::string featuresJson = result[0][0].c_str();
        std::string status = result[0][1].c_str();
        
        // MAANG Logic: Grace Period Handling
        // If they missed a payment, give them 7 days before breaking their airport operations
        if (status == "PAST_DUE") {
            // Logic to check if within 7 day grace period...
            // If exceeded:
            // Json::Value err; err["error"] = "Service suspended due to unpaid invoices.";
            // ... return 402 Payment Required
        }

        // 3. Feature Flag Check
        if (featuresJson.find(requiredFeature) == std::string::npos) {
            Json::Value err;
            err["error"] = "Upgrade required. Your current plan does not include: " + requiredFeature;
            auto res = HttpResponse::newHttpJsonResponse(err);
            res->setStatusCode(k403Forbidden); // 403 Forbidden
            fcb(res);
            return;
        }

        fccb(); // Feature is allowed, proceed to controller

    } catch (...) {
        auto res = HttpResponse::newHttpResponse();
        res->setStatusCode(k401Unauthorized);
        fcb(res);
    }
}