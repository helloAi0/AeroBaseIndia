#pragma once
#include <string>
#include "../models/AuditLog.h"

class AuditService {
public:
    static void log(const AuditLog& entry);
};
