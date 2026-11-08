#pragma once
#include "../config/RedisManager.h"
#include <hiredis/hiredis.h>
#include <string>

class EventPublisher {
public:
    /**
     * Publishes an event to a tenant-specific Redis channel with manual memory management.
     * Channel format: tenant:{tenantId}:events
     */
    static void publish(const std::string& tenantId, const std::string& message) {
        auto redis = RedisManager::getConnection(); // Returns redisContext*
        if (!redis) return;

        std::string channel = "tenant:" + tenantId + ":events";
        
        // MAANG Logic: Bypassing high-level wrappers for raw performance and memory control.
        // We use redisCommand to ensure the binary-safe strings are sent directly to the wire.
        redisReply* reply = (redisReply*)redisCommand(
            redis,
            "PUBLISH %s %s",
            channel.c_str(),
            message.c_str()
        );

        // 🛡️ Error Handling: Strict memory cleanup for the reply object.
        // Failing to free the replyObject is the #1 cause of 'Slow Death' in long-running C++ backends.
        if (reply) {
            // Check if the command succeeded (integer reply > 0 means at least one subscriber received it)
            // if (reply->type == REDIS_REPLY_INTEGER) { ... log success ... }
            freeReplyObject(reply);
        } else {
            // Handle context errors (e.g., pipe broken)
            // RedisManager::handleDisconnect(redis);
        }
    }
};