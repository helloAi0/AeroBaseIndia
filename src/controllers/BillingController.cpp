#include <drogon/drogon.h>
#include "../services/BillingService.h"
#include "../services/JwtService.h"
#include "../repositories/BillingRepository.h"

using namespace drogon;

class BillingController : public HttpController<BillingController> {
public:
    METHOD_LIST_BEGIN
        // API: POST /api/billing/invoice (Internal/Admin use)
        ADD_METHOD_TO(BillingController::createInvoiceApi, "/api/billing/invoice", Post);
        
        // API: GET /api/billing/invoices (History)
        ADD_METHOD_TO(BillingController::getInvoices, "/api/billing/invoices", Get);
        
        // API: GET /api/billing/subscription (Current Plan & Usage)
        ADD_METHOD_TO(BillingController::getSubscription, "/api/billing/subscription", Get);
        
        // API: POST /api/billing/upgrade (Change Tier)
        ADD_METHOD_TO(BillingController::upgradePlan, "/api/billing/upgrade", Post);
    METHOD_LIST_END

    // --- 1. POST: Manually Generate Invoice ---
    void createInvoiceApi(const HttpRequestPtr& req,
                          std::function<void(const HttpResponsePtr&)>&& callback) {
        try {
            auto json = req->getJsonObject();
            if (!json) throw std::runtime_error("Invalid JSON");

            Invoice invoice = BillingService::generateInvoice(
                (*json)["tenant_id"].asString(),
                (*json)["subscription_id"].asString(),
                (*json)["amount"].asDouble()
            );

            BillingRepository::createInvoice(invoice);

            Json::Value response;
            response["invoice_id"] = invoice.id;
            response["status"] = "created";
            callback(HttpResponse::newHttpJsonResponse(response));
        } catch (const std::exception& e) {
            Json::Value err;
            err["error"] = e.what();
            callback(HttpResponse::newHttpJsonResponse(err));
        }
    }

    // --- 2. GET: List All Invoices for Tenant ---
    void getInvoices(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& callback) {
        try {
            // Extract Tenant identity from JWT
            std::string authHeader = req->getHeader("Authorization");
            auto decoded = JwtService::verifyToken(authHeader.substr(7));
            std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();

            auto invoices = BillingRepository::getInvoicesByTenant(tenantId);
            
            Json::Value res(Json::arrayValue);
            for (const auto& inv : invoices) {
                Json::Value item;
                item["id"] = inv.id;
                item["amount"] = inv.amount;
                item["status"] = inv.status;
                item["date"] = inv.dueAt;
                res.append(item);
            }
            callback(HttpResponse::newHttpJsonResponse(res));
        } catch (...) {
            callback(HttpResponse::newHttpJsonResponse(Json::Value(Json::arrayValue)));
        }
    }

    // --- 3. GET: Fetch Subscription & Usage Metrics ---
    void getSubscription(const HttpRequestPtr& req,
                        std::function<void(const HttpResponsePtr&)>&& callback) {
        try {
            std::string authHeader = req->getHeader("Authorization");
            auto decoded = JwtService::verifyToken(authHeader.substr(7));
            std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();

            Json::Value info = BillingRepository::getSubscriptionInfo(tenantId);
            callback(HttpResponse::newHttpJsonResponse(info));
        } catch (const std::exception& e) {
            Json::Value err;
            err["error"] = "Subscription not found";
            callback(HttpResponse::newHttpJsonResponse(err));
        }
    }

    // --- 4. POST: Upgrade Plan ---
    void upgradePlan(const HttpRequestPtr& req,
                    std::function<void(const HttpResponsePtr&)>&& callback) {
        try {
            auto json = req->getJsonObject();
            std::string newPlan = (*json)["plan_id"].asString(); // e.g., "premium"

            std::string authHeader = req->getHeader("Authorization");
            auto decoded = JwtService::verifyToken(authHeader.substr(7));
            std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();

            BillingRepository::updatePlan(tenantId, newPlan);

            Json::Value res;
            res["result"] = "success";
            res["new_plan"] = newPlan;
            callback(HttpResponse::newHttpJsonResponse(res));
        } catch (const std::exception& e) {
            Json::Value err;
            err["error"] = e.what();
            callback(HttpResponse::newHttpJsonResponse(err));
        }
    }
};