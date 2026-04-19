#include "FlightController.h"
#include "../services/JwtService.h"
#include "../services/AuthService.h" 
#include "../services/RBACService.h"
#include "../services/FlightCacheService.h"
#include "../services/RequestTimer.h" // Added for performance logging
#include "../config/DatabaseManager.h"
#include "../repositories/AuditRepository.h"
#include "../models/AuditLog.h"
#include <chrono> // Added for timing

using namespace drogon;

// 1. Implementation of GET (List Flights)
void FlightController::getFlights(const HttpRequestPtr& req, 
                                  std::function<void(const HttpResponsePtr&)>&& callback) {
    auto start = std::chrono::steady_clock::now(); // Start Stopwatch

    try {
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();

        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        
        auto result = txn.exec_params(
            "SELECT flight_number, destination, status FROM flights WHERE tenant_id = $1", 
            tenantId
        );

        Json::Value flights(Json::arrayValue);
        for (auto const &row : result) {
            Json::Value f;
            f["flight_number"] = row[0].c_str();
            f["destination"] = row[1].c_str();
            f["status"] = row[2].c_str();
            flights.append(f);
        }

        RequestTimer::logRequest(req->path(), start); // Log Duration
        callback(HttpResponse::newHttpJsonResponse(flights));
    } catch (...) {
        RequestTimer::logRequest(req->path(), start); // Log even on failure
        callback(HttpResponse::newHttpJsonResponse(Json::Value(Json::arrayValue)));
    }
}

// 2. Implementation of POST (Add Flight)
void FlightController::addFlight(const HttpRequestPtr& req, 
                                 std::function<void(const HttpResponsePtr&)>&& callback) {
    auto start = std::chrono::steady_clock::now();

    try {
        // A. Authenticate
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        
        std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();
        std::string staffRole = decoded.get_payload_claim("role").as_string();
        std::string staffId = decoded.get_payload_claim("user_id").as_string();

        // B. RBAC Check
        if (!RBACService::hasPermission(staffRole, "MANAGE_FLIGHTS")) {
            Json::Value err;
            err["error"] = "Forbidden: Insufficient permissions";
            auto resp = HttpResponse::newHttpJsonResponse(err);
            resp->setStatusCode(k403Forbidden);
            
            RequestTimer::logRequest(req->path(), start);
            callback(resp);
            return;
        }

        // C. Parse Body
        auto json = req->getJsonObject();
        if (!json) throw std::runtime_error("Invalid JSON body");

        // D. Database Transaction
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        std::string flightId = AuthService::generateUUID();
        
        txn.exec_params(
            "INSERT INTO flights (id, tenant_id, flight_number, origin, destination, departure_time, arrival_time, gate) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            flightId, tenantId, 
            (*json)["flight_number"].asString(),
            (*json)["origin"].asString(),
            (*json)["destination"].asString(),
            (*json)["departure_time"].asString(),
            (*json)["arrival_time"].asString(),
            (*json)["gate"].asString()
        );
        txn.commit();

        // E. Audit Logging
        AuditLog log;
        log.id = AuthService::generateUUID();
        log.tenantId = tenantId;
        log.staffId = staffId;
        log.action = "Created Flight";
        log.entityType = "Flight";
        log.entityId = flightId;
        AuditRepository::log(log);

        Json::Value res;
        res["result"] = "ok";
        res["flight_id"] = flightId;

        RequestTimer::logRequest(req->path(), start);
        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Json::Value err;
        err["error"] = e.what();
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k401Unauthorized);

        RequestTimer::logRequest(req->path(), start);
        callback(resp);
    }
}

// 3. Implementation of GET Live Status
void FlightController::getLiveStatus(const HttpRequestPtr& req,
                                     std::function<void(const HttpResponsePtr&)>&& callback,
                                     std::string flightId) {
    auto start = std::chrono::steady_clock::now();
    Json::Value response;
    
    std::string currentStatus = FlightCacheService::getFlightStatus(flightId);
    
    if (currentStatus.empty()) {
        response["status"] = "Unknown";
        response["message"] = "No live data in cache";
    } else {
        response["status"] = currentStatus;
        response["flight_id"] = flightId;
    }

    RequestTimer::logRequest(req->path(), start);
    callback(HttpResponse::newHttpJsonResponse(response));
}