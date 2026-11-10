#include "ManifestController.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

void ManifestController::uploadManifest(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, std::string flightId) {
    auto json = req->getJsonObject();
    if (!json || !json->isMember("passengers") || !(*json)["passengers"].isArray()) {
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k400BadRequest);
        callback(resp);
        return;
    }

    std::string partnerId = req->attributes()->get<std::string>("verified_partner_id");

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        // Security check: Does this flight belong to this partner?
        auto check = txn.exec_params("SELECT id FROM flights WHERE id = $1 AND airline_partner_id = $2", flightId, partnerId);
        if (check.empty()) {
            throw std::runtime_error("Flight not found or does not belong to this partner.");
        }

        const Json::Value& passengers = (*json)["passengers"];
        
        // MAANG Logic: High-Performance Batch Insertion using prepared statements
        // For Postgres in C++, doing sequential inserts inside a single 'work' block is highly optimized
        for (const auto& pax : passengers) {
            std::string name = pax["name"].asString();
            std::string passport = pax["passport"].asString();
            std::string seat = pax["seat"].asString();

            // 1. Upsert Passenger (Passengers might fly multiple times)
            auto paxRes = txn.exec_params(
                "INSERT INTO passengers (full_name, passport_number) VALUES ($1, $2) "
                "ON CONFLICT (passport_number) DO UPDATE SET full_name = EXCLUDED.full_name "
                "RETURNING id",
                name, passport
            );
            std::string actualPaxId = paxRes[0][0].c_str();

            // 2. Insert Booking
            txn.exec_params(
                "INSERT INTO bookings (passenger_id, flight_id, seat_number, status) "
                "VALUES ($1, $2, $3, 'Confirmed') "
                "ON CONFLICT (passenger_id, flight_id) DO UPDATE SET seat_number = EXCLUDED.seat_number",
                actualPaxId, flightId, seat
            );
        }

        txn.commit(); // ALL 300 passengers committed at once

        Json::Value res;
        res["message"] = "Manifest processed successfully";
        res["passengers_loaded"] = (int)passengers.size();
        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Logger::error("Manifest Upload Failed: " + std::string(e.what()));
        Json::Value err;
        err["error"] = "Internal server error";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k400BadRequest);
        callback(resp);
    }
}