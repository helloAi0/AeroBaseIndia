#include "PassengerFlightController.h"
#include "../services/JwtService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <chrono>

void PassengerFlightController::getPassengerFlights(const HttpRequestPtr& req,
                                                    std::function<void(const HttpResponsePtr&)>&& callback)
{
    try {
        // 1. Auth Gate: Ensure the user is a registered Passenger
        std::string authHeader = req->getHeader("Authorization");
        if (authHeader.size() < 7) {
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k401Unauthorized);
            callback(resp);
            return;
        }

        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        std::string role = decoded.get_payload_claim("role").as_string();

        if (role != "PASSENGER") {
            Json::Value err;
            err["error"] = "Access restricted to passengers";
            auto resp = HttpResponse::newHttpJsonResponse(err);
            resp->setStatusCode(k403Forbidden);
            callback(resp);
            return;
        }

        // 2. Fetch Active Flights
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        // Passengers see all upcoming flights regardless of tenant (Airport-wide view)
        auto result = txn.exec(
            "SELECT flight_number, origin, destination, gate, status "
            "FROM flights "
            "WHERE status != 'Arrived' AND status != 'Cancelled' "
            "ORDER BY departure_time ASC LIMIT 50"
        );

        // 3. Build the Response Array
        Json::Value flightList(Json::arrayValue);
        for (auto const &row : result) {
            Json::Value f;
            f["flight_number"] = row[0].c_str();
            f["departure"] = row[1].c_str();
            f["destination"] = row[2].c_str();
            f["gate"] = row[3].c_str();
            f["status"] = row[4].c_str();
            
            // Add AI context if available
            // f["ai_notice"] = "✅ AI Prediction active for this flight";
            
            flightList.append(f);
        }

        callback(HttpResponse::newHttpJsonResponse(flightList));

    } catch (const std::exception& e) {
        Logger::error("Passenger Flight Board Error: " + std::string(e.what()));
        Json::Value err;
        err["error"] = "Unable to fetch flight board";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
    }
}