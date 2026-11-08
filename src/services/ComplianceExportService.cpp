#include "ComplianceExportService.h"
#include "../config/DatabaseManager.h"
#include <pqxx/pqxx>
#include <sstream>
#include <regex>
#include <json/json.h>

Json::Value ComplianceExportService::exportLogs(const std::string& tenantId,
                                               const std::string& from,
                                               const std::string& to) {
    Json::Value logs(Json::arrayValue);
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT id, action, entity_type, created_at FROM audit_logs "
            "WHERE tenant_id=$1 AND created_at BETWEEN $2 AND $3",
            tenantId, from, to);
        for (auto const &row : r) {
            Json::Value entry;
            entry["id"]          = row[0].c_str();
            entry["action"]      = row[1].c_str();
            entry["entity_type"] = row[2].c_str();
            entry["created_at"]  = row[3].c_str();
            logs.append(entry);
        }
    } catch (const std::exception& /*e*/) {
        // Swallowing exceptions intentionally; return empty array on failure.
    }
    return logs;
}

std::string ComplianceExportService::generateDGCA_CSV(const std::string& tenantId) {
    std::stringstream csv;
    csv << "Timestamp,Action,Resource,Details(Masked)\n";

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);

        auto result = txn.exec_params(
            "SELECT action_type, resource_type, details, created_at FROM compliance_audit "
            "WHERE tenant_id = $1 ORDER BY created_at DESC",
            tenantId
        );

        for (auto const &row : result) {
            std::string action    = row[0].c_str();
            std::string resource  = row[1].c_str();
            std::string details   = row[2].c_str();
            std::string timestamp = row[3].c_str();

            // Mask sensitive data before exporting
            maskSensitiveData(details);

            // Ensure details are CSV-safe by escaping double quotes
            std::string escapedDetails;
            escapedDetails.reserve(details.size());
            for (char c : details) {
                if (c == '"') escapedDetails += "\"\"";
                else escapedDetails += c;
            }

            csv << timestamp << ","
                << action << ","
                << resource << ",\""
                << escapedDetails << "\"\n";
        }
    } catch (const std::exception& /*e*/) {
        // On error, return whatever we've built so far (could be just header)
    }

    return csv.str();
}

void ComplianceExportService::maskSensitiveData(std::string& jsonStr) {
    // 1) Mask email addresses: replace with [REDACTED_EMAIL]
    try {
        static const std::regex emailRe(R"(([\w\.\-+%]+)@([\w\.\-]+\.[A-Za-z]{2,}))",
                                        std::regex::ECMAScript | std::regex::icase);
        jsonStr = std::regex_replace(jsonStr, emailRe, "[REDACTED_EMAIL]");
    } catch (...) {
        // If regex fails for any reason, leave the string as-is
    }

    // 2) Mask long digit sequences (e.g., passport numbers, long IDs)
    try {
        static const std::regex longDigitsRe(R"(\b\d{6,}\b)");
        jsonStr = std::regex_replace(jsonStr, longDigitsRe, "[REDACTED]");
    } catch (...) {
        // ignore
    }

    // 3) Optional: mask common PII keys if present (simple string-based redaction)
    // This is a best-effort approach; a robust implementation should parse JSON and redact specific fields.
    const std::vector<std::string> keysToMask = {"\"name\"", "\"full_name\"", "\"passport\"", "\"ssn\"", "\"phone\""};
    for (const auto& key : keysToMask) {
        size_t pos = 0;
        while ((pos = jsonStr.find(key, pos)) != std::string::npos) {
            // find the following ':' and the opening quote of the value
            size_t colon = jsonStr.find(':', pos + key.size());
            if (colon == std::string::npos) break;
            size_t quote = jsonStr.find('"', colon);
            if (quote == std::string::npos) break;
            size_t endQuote = jsonStr.find('"', quote + 1);
            if (endQuote == std::string::npos) break;
            // replace the value between quote+1 and endQuote-1 with [REDACTED]
            jsonStr.replace(quote + 1, endQuote - (quote + 1), "[REDACTED]");
            pos = quote + 1;
        }
    }
}
