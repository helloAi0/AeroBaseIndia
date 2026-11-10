#pragma once
#include <pqxx/pqxx>
#include <json/json.h>
#include "../config/DatabaseManager.h"

// Best-effort audit trail. Never throws: auditing must not break the request.
namespace AuditWriter {
inline void record(const std::string& tenantId, const std::string& userId, const std::string& action,
                   const std::string& entityType, const Json::Value& details, const std::string& ip) {
    try {
        Json::StreamWriterBuilder w; w["indentation"] = "";
        const std::string js = Json::writeString(w, details);
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, new_data, ip_address) "
            "VALUES (gen_random_uuid(), NULLIF($1,'')::uuid, NULLIF($2,'')::uuid, $3, $4, $5::jsonb, $6)",
            tenantId, userId, action, entityType, js, ip);
        txn.commit();
    } catch (...) {}
}
}
