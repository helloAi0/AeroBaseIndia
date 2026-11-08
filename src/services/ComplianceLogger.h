#pragma once
#include <string>
#include <json/json.h>

class ComplianceLogger {
public:
    /**
     * Logs high-sensitivity actions to the compliance_audit table.
     * resourceId is passed as a string and converted to UUID in SQL.
     */
    static void log(
        const std::string& tenantId,
        const std::string& userId,
        const std::string& actionType,   // e.g., "FLIGHT_MODIFIED"
        const std::string& resourceType, // e.g., "FLIGHT"
        const std::string& resourceId,
        const Json::Value& details,      // Changed fields, old vs new
        const std::string& ipAddress
    );
};