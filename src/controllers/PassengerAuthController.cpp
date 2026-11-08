#include "PassengerAuthController.h"
#include "../services/AuthService.h"
#include "../services/JwtService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"

void PassengerAuthController::registerPassenger(const HttpRequestPtr& req,
                                                std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto json = req->getJsonObject();
    if (!json) {
        callback(HttpResponse::newHttpJsonResponse(Json::Value("Invalid JSON")));
        return;
    }

    try {
        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();
        std::string name = (*json)["name"].asString();

        // 1. Hash the password before storage (Security First!)
        std::string hashedPassword = AuthService::hashPassword(password);
        std::string passengerId = AuthService::generateUUID();

        // 2. Store in Database
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO passengers (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)",
            passengerId, email, hashedPassword, name, "PASSENGER"
        );
        txn.commit();

        Json::Value res;
        res["result"] = "ok";
        res["message"] = "Passenger registered successfully";
        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Logger::error("Registration failed: " + std::string(e.what()));
        Json::Value err;
        err["error"] = "Email already exists or database error";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k400BadRequest);
        callback(resp);
    }
}

void PassengerAuthController::loginPassenger(const HttpRequestPtr& req,
                                             std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto json = req->getJsonObject();
    if (!json) {
        callback(HttpResponse::newHttpJsonResponse(Json::Value("Invalid JSON")));
        return;
    }

    try {
        std::string email = (*json)["email"].asString();
        std::string password = (*json)["password"].asString();

        // 1. Fetch user from DB
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto result = txn.exec_params("SELECT id, password_hash FROM passengers WHERE email = $1", email);

        if (result.empty() || !AuthService::verifyPassword(password, result[0][1].c_str())) {
            Json::Value err;
            err["error"] = "Invalid credentials";
            auto resp = HttpResponse::newHttpJsonResponse(err);
            resp->setStatusCode(k401Unauthorized);
            callback(resp);
            return;
        }

        // 2. Generate JWT with MANG-level claims
        std::string passengerId = result[0][0].c_str();
        
        // --- The 'MAANG' Logic: Role-based Token ---
        std::map<std::string, std::string> claims;
        claims["user_id"] = passengerId;
        claims["role"] = "PASSENGER";
        claims["tenant_id"] = "GLOBAL"; // Passengers aren't usually tied to a single tenant

        std::string token = JwtService::generateToken(claims);

        Json::Value res;
        res["token"] = token;
        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        callback(HttpResponse::newHttpJsonResponse(Json::Value("Internal Server Error")));
    }
}