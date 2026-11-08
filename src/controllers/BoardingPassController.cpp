#include "BoardingPassController.h"
#include "../services/JwtService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

void BoardingPassController::generatePass(const HttpRequestPtr& req,
                                          std::function<void(const HttpResponsePtr&)>&& callback,
                                          std::string bookingId)
{
    try {
        // 1. Auth Check: Get User ID from JWT
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        std::string userId = decoded.get_payload_claim("user_id").as_string();

        // 2. Database Validation: Ensure this booking belongs to THIS user
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        // Security logic: Join booking with user ID to verify ownership
        auto result = txn.exec_params(
            "SELECT b.booking_reference, b.seat_number, f.flight_number "
            "FROM bookings b "
            "JOIN flights f ON b.flight_id = f.id "
            "WHERE b.id = $1 AND b.passenger_id = $2",
            bookingId, userId
        );

        if (result.empty()) {
            Json::Value err;
            err["error"] = "Booking not found or access denied";
            auto resp = HttpResponse::newHttpJsonResponse(err);
            resp->setStatusCode(k403Forbidden);
            callback(resp);
            return;
        }

        // 3. Extract Data
        std::string bookingRef = result[0][0].c_str();
        std::string seat = result[0][1].c_str();
        std::string flightNum = result[0][2].c_str();

        // 4. Generate QR Code (Mocking the Base64 for the demo)
        // In production, you'd use 'libqrencode' to turn "FLIGHT:AI203|SEAT:12A" into a PNG
        std::string mockQrBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

        // 5. Construct Response
        Json::Value res;
        res["booking_reference"] = bookingRef;
        res["seat"] = seat;
        res["flight_number"] = flightNum;
        res["qr_code"] = mockQrBase64;
        res["status"] = "Valid ✅ AI Prediction Ready";

        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Logger::error("Boarding Pass Generation Failed: " + std::string(e.what()));
        Json::Value err;
        err["error"] = "System error generating pass";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k500InternalServerError);
        callback(resp);
    }
}