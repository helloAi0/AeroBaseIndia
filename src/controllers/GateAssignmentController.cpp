#include "GateAssignmentController.h"
#include "../config/DatabaseManager.h"
#include <drogon/drogon.h>

void GateAssignmentController::getGate(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, std::string flightId) {
auto redisClient = drogon::app().getRedisClient("default");
    std::string cacheKey = "flight_gate_" + flightId;

    // 1. Check Redis Cache First (High Performance)
    redisClient->execCommandAsync(
        [callback](const drogon::nosql::RedisResult &r) {
            if (r.type() == drogon::nosql::RedisResultType::kString) {
                // Cache hit! Parse and return immediately.
                Json::Value res;
                Json::Reader reader;
                reader.parse(r.asString(), res);
                callback(HttpResponse::newHttpJsonResponse(res));
            }
        },
        [flightId, callback, cacheKey](const std::exception &err) {
            // 2. Cache Miss or Error: Fallback to Database
            try {
                auto conn = DatabaseManager::getConnection();
                pqxx::read_transaction txn(*conn);
                auto result = txn.exec_params(
                    "SELECT gate, boarding_time FROM flights WHERE id = $1", flightId
                );

                if (result.empty()) throw std::runtime_error("Flight not found");

                Json::Value res;
                res["gate"] = result[0][0].c_str();
                res["boarding_time"] = result[0][1].c_str();

                // 3. Update Redis Cache (TTL: 5 minutes)
                Json::StreamWriterBuilder writer;
                std::string jsonStr = Json::writeString(writer, res);
auto redisClient = drogon::app().getRedisClient("default");
                redisClient->execCommandAsync([](const drogon::nosql::RedisResult &) {}, [](const std::exception &) {}, 
                                          "SETEX %s 300 %s", cacheKey.c_str(), jsonStr.c_str());

                callback(HttpResponse::newHttpJsonResponse(res));

            } catch (const std::exception& e) {
                auto resp = HttpResponse::newHttpResponse();
                resp->setStatusCode(k404NotFound);
                callback(resp);
            }
        },
        "GET %s", cacheKey.c_str()
    );
}