#include <drogon/drogon.h>
#include "../middleware/AuthMiddleware.h"
#include "../services/BaggageService.h"
#include "../repositories/BaggageRepository.h"

using namespace drogon;

class BaggageController : public HttpController<BaggageController> {
public:
    METHOD_LIST_BEGIN
        // POST /baggage - Initial check-in
        ADD_METHOD_TO(BaggageController::checkInBag, "/baggage", Post);
        // PUT /baggage/status - Update tracking status
        ADD_METHOD_TO(BaggageController::updateBagStatus, "/baggage/status", Put);
    METHOD_LIST_END

    /**
     * POST /baggage
     * Handles the initial baggage check-in process.
     */
    void checkInBag(const HttpRequestPtr& req,
                    std::function<void(const HttpResponsePtr&)>&& callback) {
        std::string tenantId;

        // FIXED SYNTAX: Explicit response object creation for 401 Unauthorized
        if (!AuthMiddleware::validate(req, tenantId)) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k401Unauthorized);
            callback(resp);
            return;
        }

        auto json = req->getJsonObject();
        if (!json) {
            Json::Value error;
            error["error"] = "Missing JSON payload";
            callback(HttpResponse::newHttpJsonResponse(error));
            return;
        }

        try {
            Baggage bag = BaggageService::createBag(
                tenantId,
                (*json)["passenger_id"].asString(),
                (*json)["ticket_id"].asString(),
                (*json)["flight_id"].asString(),
                (*json)["flight_number"].asString(),
                (*json)["weight"].asDouble(),
                (*json)["sequence"].asInt()
            );

            BaggageRepository::createBaggage(bag);

            Json::Value response;
            response["tag_number"] = bag.tagNumber;
            response["status"] = bag.status;

            callback(HttpResponse::newHttpJsonResponse(response));
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            auto resp = HttpResponse::newHttpJsonResponse(error);
            resp->setStatusCode(k500InternalServerError);
            callback(resp);
        }
    }

    /**
     * PUT /baggage/status
     * Updates tracking status (e.g., 'In Transit', 'Loaded')
     */
    void updateBagStatus(const HttpRequestPtr& req,
                         std::function<void(const HttpResponsePtr&)>&& callback) {
        std::string tenantId;
        
        // Applying the same robust 401 check here for consistency
        if (!AuthMiddleware::validate(req, tenantId)) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k401Unauthorized);
            callback(resp);
            return;
        }

        auto json = req->getJsonObject();
        if (!json) {
            Json::Value error;
            error["error"] = "Invalid JSON body";
            callback(HttpResponse::newHttpJsonResponse(error));
            return;
        }

        try {
            BaggageRepository::updateStatus(
                (*json)["tag_number"].asString(),
                (*json)["status"].asString(),
                (*json)["location"].asString()
            );

            Json::Value response;
            response["message"] = "Baggage updated successfully";
            response["tag_number"] = (*json)["tag_number"].asString();
            response["new_status"] = (*json)["status"].asString();

            callback(HttpResponse::newHttpJsonResponse(response));
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            auto resp = HttpResponse::newHttpJsonResponse(error);
            resp->setStatusCode(k400BadRequest); // Usually a validation or logic error
            callback(resp);
        }
    }
};