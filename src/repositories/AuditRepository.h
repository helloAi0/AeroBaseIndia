#pragma once
#include "../config/DatabaseManager.h"
#include "../models/AuditLog.h"

class AuditRepository {
public:
    // Upgraded from 'log' to 'save' to support comprehensive audit trails
    static void save(const AuditLog& log) {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        txn.exec_params(
            "INSERT INTO audit_logs("
            "id, tenant_id, staff_id, action, entity_type, entity_id, "
            "old_data, new_data, ip_address"
            ") VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            log.id,
            log.tenantId,
            log.staffId, // Using staffId from your previous model
            log.action,
            log.entityType,
            log.entityId,
            log.oldData,
            log.newData,
            log.ipAddress
        );

        txn.commit();
    }
};