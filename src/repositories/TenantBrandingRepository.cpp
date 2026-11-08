#include "TenantBrandingRepository.h"
#include "../config/DatabaseManager.h"
#include <pqxx/pqxx>
#include <json/json.h>

Json::Value TenantBrandingRepository::getBranding(const std::string& tenantId) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT logo_url, primary_color, airport_name "
            "FROM tenant_branding WHERE tenant_id=$1", tenantId);
        Json::Value out;
        if (!r.empty()) {
            out["logo_url"]      = r[0][0].c_str();
            out["primary_color"] = r[0][1].c_str();
            out["airport_name"]  = r[0][2].c_str();
        }
        return out;
    } catch (...) { return Json::Value(); }
}

bool TenantBrandingRepository::saveBranding(const std::string& tenantId,
                                             const Json::Value& b) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO tenant_branding(tenant_id,logo_url,primary_color,airport_name) "
            "VALUES($1,$2,$3,$4) ON CONFLICT(tenant_id) DO UPDATE SET "
            "logo_url=EXCLUDED.logo_url, primary_color=EXCLUDED.primary_color, "
            "airport_name=EXCLUDED.airport_name",
            tenantId,
            b["logo_url"].asString(),
            b["primary_color"].asString(),
            b["airport_name"].asString());
        txn.commit();
        return true;
    } catch (...) { return false; }
}

// Alias implementation: keep backward compatibility with callers using findByTenantId
Json::Value TenantBrandingRepository::findByTenantId(const std::string& tenantId) {
    return getBranding(tenantId);
}
