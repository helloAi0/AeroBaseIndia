#include "RevenueController.h"
#include "../services/JwtService.h"
#include "../services/RBACService.h"
#include "../services/RevenueAggregationService.h"
#include "../analytics/RevenueForecastEngine.h"
#include "../analytics/RevenueRecommendationEngine.h"

void RevenueController::getDashboard(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    try {
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();
        std::string role = decoded.get_payload_claim("role").as_string();

        // 1. Strict Security: Only C-Level or Finance can view this data
        if (!RBACService::hasPermission(role, "VIEW_FINANCIALS")) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k403Forbidden);
            callback(resp);
            return;
        }

        Json::Value dashboard;
        
        // 2. Aggregate the data (Fast execution using Redis caches built earlier)
        dashboard["today_revenue"] = RevenueAggregationService::getDailyRevenue(tenantId);
        dashboard["forecast"] = RevenueForecastEngine::predictNextMonth(tenantId);
        dashboard["recommendations"] = RevenueRecommendationEngine::generateInsights(tenantId);
        
        // Mocked Top Performers
        dashboard["best_gate"] = "A12";
        dashboard["top_store"] = "Duty Free Terminal 3";

        callback(HttpResponse::newHttpJsonResponse(dashboard));

    } catch (...) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k401Unauthorized);
        callback(resp);
    }
}