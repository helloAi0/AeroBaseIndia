#pragma once
#include <string>
#include <json/json.h>

class TenantBrandingRepository {
public:
    static Json::Value getBranding(const std::string& tenantId);
    static bool        saveBranding(const std::string& tenantId, const Json::Value& branding);
};