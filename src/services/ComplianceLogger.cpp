#include "ComplianceLogger.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <drogon/drogon.h>

void ComplianceLogger::log(
    const std::string& tenantId,
    const std::string& userId,
    const std::string& actionType,
    const std::string& resourceType,
    const std::string& resourceId,
    const Json::Value& details,
    const std::string& ipAddress
) {
    // MAANG Logic: Execute as a background task to avoid blocking the main request
    drogon::app().getLoop()->queueInLoop([=]() {
        try {
            auto conn = DatabaseManager::getConnection();
            pqxx::work txn(*conn);

            // Convert Json::Value to string for Postgres JSONB column
            Json::StreamWriterBuilder writer;
            std::string detailsStr = Json::writeString(writer, details);

            txn.exec_params(
                "INSERT INTO compliance_audit "
                "(id, tenant_id, user_id, action_type, resource_type, resource_id, details, ip_address) "
                "VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)",
                tenantId,
                userId,
                actionType,
                resourceType,
                resourceId,
                detailsStr,
                ipAddress
            );

            txn.commit();
        } catch (const std::exception& e) {
            // If logging fails, we record it to the system log so the error isn't lost
            Logger::error("COMPLIANCE CRITICAL: Failed to write audit log: " + std::string(e.what()));
        }
    });
}