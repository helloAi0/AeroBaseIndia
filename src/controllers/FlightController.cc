#include "FlightController.h"
#include "../services/JwtService.h"
#include "../services/AuthService.h" 
#include "../services/RBACService.h"
#include "../services/AuditService.h"
#include "../services/SubscriptionValidator.h"
#include "../services/FlightCacheService.h"
#include "../services/EventPublisher.h"
#include "../services/RequestTimer.h"
#include "../middleware/PermissionMiddleware.h"
#include "../config/DatabaseManager.h"
#include "../models/AuditLog.h"
#include <chrono>

using namespace drogon;

// --- 1. GET: List Flights (Tenant Isolated) ---
void FlightController::getFlights(const HttpRequestPtr& req, 
                                  std::function<void(const HttpResponsePtr&)>&& callback) {
    auto start = std::chrono::steady_clock::now();

    try {
        // Auth Check
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

        RequestTimer::logRequest(req->path(), start);
        callback(HttpResponse::newHttpJsonResponse(flights));
    } catch (...) {
        RequestTimer::logRequest(req->path(), start);
        callback(HttpResponse::newHttpJsonResponse(Json::Value(Json::arrayValue)));
    }
}

// --- 2. POST: Add Flight (The "MANG" Logic) ---
void FlightController::addFlight(const HttpRequestPtr& req, 
                                 std::function<void(const HttpResponsePtr&)>&& callback) {
    auto start = std::chrono::steady_clock::now();

    try {
        // --- STEP A: Identity Authentication ---
        std::string authHeader = req->getHeader("Authorization");
        auto decoded = JwtService::verifyToken(authHeader.substr(7));
        
        std::string tenantId = decoded.get_payload_claim("tenant_id").as_string();
        std::string staffRole = decoded.get_payload_claim("role").as_string();
        std::string userIdFromToken = decoded.get_payload_claim("user_id").as_string();
        std::string userIdFromHeader = req->getHeader("X-User-Id");

        // --- STEP B: Security Gates (Middleware & RBAC) ---
        if (!PermissionMiddleware::validate(userIdFromHeader, "CREATE_FLIGHT") || 
            !RBACService::hasPermission(staffRole, "MANAGE_FLIGHTS")) {
            
            // Forensic Audit for Access Denied
            AuditLog log;
            log.id = AuthService::generateUUID();
            log.tenantId = tenantId;
            log.userId = userIdFromHeader.empty() ? userIdFromToken : userIdFromHeader;
            log.action = "ACCESS_DENIED";
            log.entityType = "SECURITY";
            log.entityId = "N/A";
            log.oldData = "{\"role\":\"" + staffRole + "\"}";
            log.newData = "{\"reason\":\"Permission or RBAC check failed\"}";
            log.ipAddress = req->peerAddr().toIp();
            AuditService::log(log);

            Json::Value error;
            error["error"] = "Access denied: Insufficient permissions";
            auto resp = HttpResponse::newHttpJsonResponse(error);
            resp->setStatusCode(k403Forbidden);
            callback(resp);
            return;
        }

        // --- STEP C: Plan Limit Enforcement ---
        try {
            SubscriptionValidator::validateFlightLimit(tenantId);
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            error["code"] = "PLAN_LIMIT_REACHED";
            auto resp = HttpResponse::newHttpJsonResponse(error);
            resp->setStatusCode(k403Forbidden);
            callback(resp);
            return;
        }

        // --- STEP D: Database Transaction (Flight + Usage Metric) ---
        auto json = req->getJsonObject();
        if (!json) throw std::runtime_error("Invalid JSON body");

        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        std::string flightId = AuthService::generateUUID();
        
        // 1. Create the Flight
        txn.exec_params(
            "INSERT INTO flights (id, tenant_id, flight_number, origin, destination, departure_time, arrival_time, gate, status) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            flightId, tenantId, 
            (*json)["flight_number"].asString(),
            (*json)["origin"].asString(),
            (*json)["destination"].asString(),
            (*json)["departure_time"].asString(),
            (*json)["arrival_time"].asString(),
            (*json)["gate"].asString(),
            "Scheduled"
        );

        // 2. Log usage for Billing
        txn.exec_params(
            "INSERT INTO usage_metrics(id, tenant_id, metric_name, metric_value) "
            "VALUES(gen_random_uuid(), $1, 'FLIGHT_CREATED', 1)",
            tenantId
        );

        txn.commit(); // Atomic commit!

        // --- STEP E: Success Audit Logging ---
        AuditLog successLog;
        successLog.id = AuthService::generateUUID();
        successLog.tenantId = tenantId;
        successLog.userId = userIdFromToken;
        successLog.action = "CREATE";
        successLog.entityType = "FLIGHT";
        successLog.entityId = flightId;
        successLog.oldData = "{}";
        successLog.newData = "{\"flight_number\":\"" + (*json)["flight_number"].asString() + "\"}";
        successLog.ipAddress = req->peerAddr().toIp();
        AuditService::log(successLog);

        // --- STEP F: Event/WebSocket Publishing ---
        std::string event =
            "{\"type\":\"FLIGHT_CREATED\","
            "\"flight_id\":\"" + flightId + "\","
            "\"tenant_id\":\"" + tenantId + "\","
            "\"status\":\"Scheduled\"}";
        EventPublisher::publish(tenantId, event);

        // Response
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

// --- 3. GET: Live Status (Redis Optimized) ---
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