#include "RetentionJob.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <drogon/drogon.h>

void RetentionJob::startNightlyCleanup() {
    // Run every 24 hours (86400 seconds)
    drogon::app().getLoop()->runEvery(86400.0, []() {
        Logger::info("Starting Nightly Data Retention Cleanup Job...");

        try {
            auto conn = DatabaseManager::getConnection();
            pqxx::work txn(*conn);

            // Rule 1: Delete Temporary UI Notifications > 30 days
            txn.exec("DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'");

            // Rule 2: Move old telemetry data to cold storage/delete > 90 days
            txn.exec("DELETE FROM baggage_tracking_events WHERE created_at < NOW() - INTERVAL '90 days'");

            // Rule 3: STRICT PRESERVATION - Audit logs stay for 7 years minimum. 
            // We explicitly do NOT touch compliance_audit here.

            txn.commit();
            Logger::info("Nightly Data Retention Cleanup completed successfully.");

        } catch (const std::exception& e) {
            Logger::error("CRITICAL CRON FAILURE: Retention Job Failed - " + std::string(e.what()));
        }
    });
}