#include "StaffValidationService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <pqxx/pqxx>

std::unordered_map<std::string, bool> StaffValidationService::certCache;

bool StaffValidationService::isCertifiedFor(const std::string& userId,
                                             const std::string& requiredCert) {
    std::string cacheKey = userId + "_" + requiredCert;

    auto it = certCache.find(cacheKey);
    if (it != certCache.end()) return it->second;

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto result = txn.exec_params(
            "SELECT 1 FROM staff_certifications "
            "WHERE user_id=$1 AND certification_type=$2 "
            "AND expiration_date > CURRENT_DATE",
            userId, requiredCert);
        bool certified = !result.empty();
        certCache[cacheKey] = certified;
        if (!certified)
            core::Logger::warn("BLOCKED: User " + userId +
                               " lacks cert: " + requiredCert);
        return certified;
    } catch (...) { return false; }
}
