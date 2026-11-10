#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include "../services/BillingService.h"
#include "../services/JwtService.h"
#include "../repositories/BillingRepository.h"
#include "../config/DatabaseManager.h" // Required for direct DB access

using namespace drogon;

class BillingController : public HttpController<BillingController> {
public:
    METHOD_LIST_BEGIN
        // API: POST /api/billing/invoice (Internal/Admin use)
        ADD_METHOD_TO(BillingController::createInvoiceApi, "/api/billing/invoice", Post);
        
        // API: GET /api/billing/invoices (History with RBAC)
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
            err["error"] = "Internal server error";
            callback(HttpResponse::newHttpJsonResponse(err));
        }
    }

    // --- 2. GET: List All Invoices (SECURE RBAC VERSION) ---
    void getInvoices(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& callback) {
        try {
            // 1. Identity & Role Extraction
            std::string authHeader = req->getHeader("Authorization");
            if (authHeader.length() < 7) throw std::runtime_error("Invalid Token");
            
            auto decoded = JwtService::verifyToken(authHeader.substr(7));
            std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();
            std::string role = decoded.get_payload_claim("role").as_string();

            // 2. Security: Only Billing Admins can see financial data
            if (role != "BILLING_ADMIN" && role != "SUPER_ADMIN") {
                auto resp = HttpResponse::newHttpResponse();
                resp->setStatusCode(k403Forbidden);
                callback(resp);
                return;
            }

            // 3. Direct DB Access for Complex Financial Queries
            auto conn = DatabaseManager::getConnection();
            pqxx::read_transaction txn(*conn);
            auto result = txn.exec_params(
                "SELECT id, billing_period_start, billing_period_end, total, status "
                "FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC", 
                tenantId
            );

            Json::Value invoices(Json::arrayValue);
            for (auto const &row : result) {
                Json::Value inv;
                inv["id"] = row[0].c_str();
                inv["period"] = std::string(row[1].c_str()) + " to " + std::string(row[2].c_str());
                inv["total"] = row[3].as<double>();
                inv["status"] = row[4].c_str();
                invoices.append(inv);
            }

            callback(HttpResponse::newHttpJsonResponse(invoices));
        } catch (...) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k500InternalServerError);
            callback(resp);
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
            std::string newPlan = (*json)["plan_id"].asString();

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
            err["error"] = "Internal server error";
            callback(HttpResponse::newHttpJsonResponse(err));
        }
    }
};