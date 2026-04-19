#pragma once
#include "../config/DatabaseManager.h"
#include "../models/AuditLog.h"

class AuditRepository {
public:
    static void log(const AuditLog& log) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO audit_logs(id, tenant_id, staff_id, action, entity_type, entity_id) "
            "VALUES($1,$2,$3,$4,$5,$6)",
            log.id, log.tenantId, log.staffId,
            log.action, log.entityType, log.entityId
        );

        txn.commit();
    }
};