#include "AirlineFlightController.h"
#include "../config/DatabaseManager.h"
#include "../services/DigitalTwinService.hpp" // To update the twin if needed

void AirlineFlightController::syncFlight(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        callback(resp);
        return;
    }

    std::string partnerId = req->attributes()->get<std::string>("verified_partner_id");
    std::string flightNum = (*json)["flight_number"].asString();
    std::string origin = (*json)["origin"].asString();
    std::string dest = (*json)["destination"].asString();
    std::string departure = (*json)["scheduled_departure"].asString();

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        // MAANG Logic: Idempotent Upsert (Insert or Update)
        // Ensure flights are linked to the specific airline partner
        txn.exec_params(
            "INSERT INTO flights (airline_partner_id, flight_number, origin, destination, scheduled_departure, status) "
            "VALUES ($1, $2, $3, $4, $5, 'Scheduled') "
            "ON CONFLICT (flight_number, scheduled_departure) DO UPDATE SET "
            "origin = EXCLUDED.origin, "
            "destination = EXCLUDED.destination, "
            "updated_at = CURRENT_TIMESTAMP",
            partnerId, flightNum, origin, dest, departure
        );

        txn.commit();

        Json::Value res;
        res["message"] = "Flight synchronized successfully";
        res["flight_number"] = flightNum;
        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Json::Value err;
        err["error"] = "Database sync failed: " + std::string(e.what());
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
    }
}