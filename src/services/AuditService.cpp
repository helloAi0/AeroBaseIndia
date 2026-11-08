#include "AuditService.h"
#include "../config/DatabaseManager.h"
#include <pqxx/pqxx>
#include "../core/Logger.h"

void AuditService::log(const AuditLog& entry) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO audit_logs(id,tenant_id,user_id,action,entity_type,"
            "entity_id,old_data,new_data,ip_address) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            entry.id, entry.tenantId, entry.userId, entry.action,
            entry.entityType, entry.entityId, entry.oldData,
            entry.newData, entry.ipAddress);
        txn.commit();
    } catch (const std::exception& e) {
        core::Logger::error("[AuditService] " + std::string(e.what()));
    }
}