#include "FlightController.h"
#include "../tracing/TraceContext.h"
#include "../metrics/MetricsRegistry.h"
#include "../services/JwtService.h"
#include "../services/AuthService.h" 
#include "../services/RBACService.h"
#include "../services/AuditService.h"
#include "../services/SubscriptionValidator.h"
#include "../services/FlightCacheService.h"
#include "../services/EventPublisher.h"
#include "../services/RequestTimer.h"
#include "../services/DelayPredictionService.h" 
#include "../services/ComplianceLogger.h" // Added for B2B Compliance Logging
#include "../middleware/PermissionMiddleware.h"
#include "../config/DatabaseManager.h"
#include "../models/AuditLog.h"
#include <chrono>
#include <openssl/sha.h> // Added for payload hashing
#include <iomanip>
#include <sstream>

using namespace drogon;

// --- Helper: Generate SHA-256 Payload Hash ---
std::string generatePayloadHash(const std::string& data) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256(reinterpret_cast<const unsigned char*>(data.c_str()), data.size(), hash);
    std::stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

// --- 1. GET: List Flights (Tenant Isolated) ---
void FlightController::getFlights(const HttpRequestPtr& req,
                                  std::function<void(const HttpResponsePtr&)>&& callback) {
    auto start = std::chrono::steady_clock::now();
    auto span = Tracer::getInstance().startSpan(
        "GET /flights",
        req->getHeader("X-Trace-ID"));
    span.tenantId = req->getHeader("X-Tenant-ID");
    Tracer::addTag(span, "http.method", "GET");
    Tracer::addTag(span, "http.path", "/flights");
    MetricsRegistry::getInstance().incrementCounter(
        "aerobase_http_requests_total",
        "{path=\"/flights\",method=\"GET\",status=\"200\"}");

    try {
        // Authenticated; tenant comes from the token, not a client header.
        // Only SUPER_ADMIN may view another airport via X-Tenant-ID.
        std::string tenantId, orgFilter;
        try {
            const std::string authHeader = req->getHeader("Authorization");
            if (authHeader.size() <= 7 || authHeader.rfind("Bearer ", 0) != 0) throw std::runtime_error("no token");
            auto decoded = JwtService::verifyToken(authHeader.substr(7));
            tenantId = decoded.has_payload_claim("airport") ? decoded.get_payload_claim("airport").as_string() : "";
            const std::string role = decoded.get_payload_claim("role").as_string();
            if ((role == "AIRLINE_OPS" || role == "PILOT") && decoded.has_payload_claim("org"))
                orgFilter = decoded.get_payload_claim("org").as_string();   // airline staff see only their airline
            const std::string hdr = req->getHeader("X-Tenant-ID");
            if (role == "SUPER_ADMIN" && !hdr.empty()) tenantId = hdr;
            if (tenantId.empty()) throw std::runtime_error("no airport in token");
        } catch (const std::exception&) {
            Json::Value err; err["error"] = "Unauthorized";
            auto r = HttpResponse::newHttpJsonResponse(err);
            r->setStatusCode(k401Unauthorized);
            callback(r);
            return;
        }

        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        
        auto result = txn.exec_params(
            "SELECT f.flight_number, f.destination, f.status, f.gate, f.id, f.origin, "
            "       to_char(f.departure_time,'YYYY-MM-DD\"T\"HH24:MI:SS'), to_char(f.arrival_time,'YYYY-MM-DD\"T\"HH24:MI:SS'), "
            "       COALESCE(f.airline,''), COALESCE(f.airline_code,''), COALESCE(f.aircraft,''), COALESCE(f.terminal,''), "
            "       COALESCE(f.passengers,0), COALESCE(f.issue,''), COALESCE(f.delay_minutes,0) "
            "FROM flights f JOIN tenants t ON f.tenant_id=t.id "
            "WHERE t.airport_code=$1 AND ($2 = '' OR f.airline_code = $2) "
            "ORDER BY f.departure_time ASC LIMIT 300",
            tenantId, orgFilter);

        Json::Value flights(Json::arrayValue);
        for (auto const &row : result) {
            Json::Value f;
            f["flight_number"] = row[0].c_str();
            f["destination"]   = row[1].c_str();
            f["status"]        = row[2].c_str();
            f["gate"]          = row[3].c_str();
            f["id"]            = row[4].c_str();
            f["origin"]        = row[5].is_null() ? "" : row[5].c_str();
            f["departure_time"] = row[6].is_null() ? "" : row[6].c_str();
            f["arrival_time"]   = row[7].is_null() ? "" : row[7].c_str();
            f["airline"]       = row[8].c_str();
            f["airline_code"]  = row[9].c_str();
            f["aircraft"]      = row[10].c_str();
            f["terminal"]      = row[11].c_str();
            f["passengers"]    = row[12].as<int>();
            f["issue"]         = row[13].c_str();
            f["delay_minutes"] = row[14].as<int>();
            flights.append(f);
        }

        RequestTimer::logRequest(req->path(), start);
        Tracer::getInstance().finishSpan(span, 200);
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
        
        std::string tenantId = req->getHeader("X-Tenant-ID");
        if (tenantId.empty()) tenantId = "DEL";
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
            error["error"] = "Internal server error";
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

        // --- STEP G: AI Delay Prediction (Non-Blocking) ---
        double weather = (*json).get("weather_score", 5.0).asDouble();
        double congestion = (*json).get("congestion_score", 5.0).asDouble();

        DelayPredictionService::predictDelay(weather, congestion, [flightId](int delayMins) {
            try {
                auto conn = DatabaseManager::getConnection();
                pqxx::work updateTxn(*conn);
                updateTxn.exec_params(
                    "UPDATE flights SET predicted_delay = $1 WHERE id = $2",
                    delayMins, flightId
                );
                updateTxn.commit();
            } catch (...) {
                // Silently fail or log to ensure the main app stays stable
            }
        });

        // Response
        Json::Value res;
        res["result"] = "ok";
        res["flight_id"] = flightId;
        res["message"] = "Flight created. AI prediction is processing.";
        RequestTimer::logRequest(req->path(), start);
        callback(HttpResponse::newHttpJsonResponse(res));

    } catch (const std::exception& e) {
        Json::Value err;
        err["error"] = "Internal server error";
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
