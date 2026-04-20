#pragma once
#include "../repositories/AuditRepository.h"
#include "AuthService.h"
#include "../models/AuditLog.h"

class AuditService {
public:
    /**
     * High-level logging interface. 
     * In the future, this is where you'd add logic to alert admins 
     * for sensitive actions (like unauthorized gate changes).
     */
    static void log(const AuditLog& log) {
        // We call the 'save' method we just updated in the Repository
        AuditRepository::save(log);
    }
};