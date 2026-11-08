#include "ComplianceSecurityMonitor.h"
#include "../core/Logger.h"

void ComplianceSecurityMonitor::analyzeActivity(
    const std::string& tenantId,
    const std::string& userId,
    const std::string& action)
{
    if (action == "ROLE_CHANGE" || action == "PERMISSION_ESCALATION") {
        core::Logger::warn(
            "SECURITY ALERT: High-privilege role change by User " + userId +
            " in tenant " + tenantId);
    }
}
