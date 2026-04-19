#pragma once
#include "../config/RedisManager.h"
#include <hiredis/hiredis.h>
#include <string>

class FlightCacheService {
public:
    // Update: Push status and gate to Redis Hash
    static void updateFlightStatus(const std::string& flightId,
                                   const std::string& status,
                                   const std::string& gate) {
        auto redis = RedisManager::getConnection();

        std::string key = "flight:" + flightId;

        freeReplyObject(redisCommand(redis,
                     "HMSET %s status %s gate %s",
                     key.c_str(),
                     status.c_str(),
                     gate.c_str()));
    }

    // New: Retrieve status with safety check
    static std::string getFlightStatus(const std::string& flightId) {
        auto redis = RedisManager::getConnection();

        std::string key = "flight:" + flightId;

        redisReply* reply = (redisReply*)redisCommand(
            redis,
            "HGET %s status",
            key.c_str()
        );

        std::string status = "";
        
        // Safety check: ensure the reply exists and is a string
        if (reply != nullptr) {
            if (reply->type == REDIS_REPLY_STRING) {
                status = reply->str;
            }
            freeReplyObject(reply);
        }

        return status;
    }
};