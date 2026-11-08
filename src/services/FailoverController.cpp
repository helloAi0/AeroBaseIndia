#include "FailoverController.h"
#include "HealthMonitorService.h"
#include "../services/EventPublisher.h"
#include "../core/Logger.h"
#include <drogon/drogon.h>
#include <cstdlib> // For system()

void FailoverController::promoteStandbyToMaster() {
    Logger::critical("INITIATING FAILOVER: Promoting Delhi Standby to Master...");

    // 1. Execute the PostgreSQL promotion command via WSL/Ubuntu terminal
    // (Ensure the user running the Drogon app has sudo/postgres privileges)
    int result = std::system("sudo -u postgres /usr/lib/postgresql/14/bin/pg_ctl promote -D /var/lib/postgresql/14/main");

    if (result == 0) {
        Logger::info("FAILOVER SUCCESS: Node is now the Primary Database.");
        
        // 2. Alert the Airport Ops Command Center via WebSocket
        EventPublisher::publish("SYSTEM", "{\"alert\":\"FAILOVER_COMPLETE\",\"new_master\":\"DELHI\"}");
        
        // 3. Update local app configuration dynamically so it starts writing
        // ConfigurationManager::setRole("primary"); 
    } else {
        Logger::error("FAILOVER FAILED: Could not promote PostgreSQL.");
    }
}

void FailoverController::startWatchdog() {
    // Only run this loop if the current node is the STANDBY
    // In your main.cpp: if (appConfig.role == "standby") FailoverController::startWatchdog();

    drogon::app().getLoop()->runEvery(10.0, []() {
        // Ping the Mumbai Load Balancer or Primary IP
        // If it returns down for 3 consecutive checks (30 seconds):
        bool primaryIsDown = true; // Mocked condition for the trigger
        
        static int failureCount = 0;

        if (primaryIsDown) {
            failureCount++;
            Logger::warn("Primary node unreachable. Strike " + std::to_string(failureCount));

            if (failureCount >= 3) {
                promoteStandbyToMaster();
                failureCount = 0; // Reset after promotion
                // Exit the watchdog loop since we are now the master
            }
        } else {
            failureCount = 0; // Reset on healthy ping
        }
    });
}