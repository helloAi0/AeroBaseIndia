#pragma once
#include "../config/RedisManager.h"
#include <string>

class EventPublisher {
public:
    /**
     * Publishes an event to a tenant-specific Redis channel.
     * Channel format: tenant:{tenantId}:events
     */
    static void publish(const std::string& tenantId, const std::string& message) {
        auto redis = RedisManager::getConnection();
        if (!redis) return;

        std::string channel = "tenant:" + tenantId + ":events";
        
        // Redis command: PUBLISH <channel> <message>
        redis->publish(channel, message);
    }
};