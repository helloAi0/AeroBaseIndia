#pragma once
#include <thread>
#include <iostream>
#include "../config/RedisManager.h"
#include "../controllers/FlightSocketController.cpp" // To access broadcast logic

class ServiceInitializer {
public:
    static void init() {
        std::cout << "[INIT] Bootstrapping background services..." << std::endl;
        
        // Start Redis Subscriber in a dedicated background thread
        std::thread redisThread([]() {
            try {
                auto redis = RedisManager::getSubscriberConnection();
                
                std::cout << "[REDIS] Listening for multi-tenant events..." << std::endl;

                // Pattern subscribe: listens to all tenant channels
                // Format: tenant:{tenantId}:events
                redis->psubscribe("tenant:*:events", [](const std::string& channel, const std::string& message) {
                    // Extract tenantId from "tenant:DEL:events" -> "DEL"
                    std::string tenantId = extractTenantFromChannel(channel);

                    // Forward the message to local WebSocket clients connected to THIS server
                    FlightSocketController::broadcast(tenantId, message);
                });
            } catch (const std::exception& e) {
                std::cerr << "[CRITICAL] Redis Subscriber failed: " << e.what() << std::endl;
            }
        });

        // Detach thread so it runs independently of the main thread
        redisThread.detach();
    }

private:
    static std::string extractTenantFromChannel(const std::string& channel) {
        // Simple logic: find the part between "tenant:" and ":events"
        size_t start = channel.find(':') + 1;
        size_t end = channel.find(':', start);
        return channel.substr(start, end - start);
    }
};