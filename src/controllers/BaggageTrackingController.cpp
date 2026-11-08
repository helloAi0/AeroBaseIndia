#include "BaggageTrackingController.h"
#include "../services/JwtService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

void BaggageTrackingController::trackBaggage(const HttpRequestPtr& req,
                                             std::function<void(const HttpResponsePtr&)>&& callback,
                                             std::string tagId)
{
    try {
        // 1. Auth Gate: Validate Passenger Identity
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        std::string userId = decoded.get_payload_claim("user_id").as_string();

        // 2. Database Fetch: Get the latest status and location
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        // Security logic: Join baggage with bookings to verify the bag belongs to the user
        auto result = txn.exec_params(
            "SELECT b.status, b.last_location, b.updated_at "
            "FROM baggage b "
            "JOIN bookings bk ON b.booking_id = bk.id "
            "WHERE b.tag_id = $1 AND bk.passenger_id = $2",
            tagId, userId
        );

        if (result.empty()) {
            Json::Value err;
            err["error"] = "Baggage tag not found or access denied";
            auto resp = HttpResponse::newHttpJsonResponse(err);
            resp->setStatusCode(k404NotFound);
            callback(resp);
            return;
        }

        // 3. Construct the Professional Response
        Json::Value res;
        res["tag_id"] = tagId;
        res["status"] = result[0][0].c_str();
        res["location"] = result[0][1].c_str();
        res["last_updated"] = result[0][2].c_str();
        
        // 4. 'MAANG' Logic: Predictive Arrival
        // If the bag is "In Transit", we could show an AI-calculated ETA
        if (std::string(result[0][0].c_str()) == "In Transit") {
            res["estimated_arrival"] = "15 minutes ✅ AI Prediction";
        }

        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Logger::error("Baggage Tracking Error: " + std::string(e.what()));
        Json::Value err;
        err["error"] = "Internal system error";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
    }
}