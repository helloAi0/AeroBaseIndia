#pragma once

#include "../models/TenantBranding.h"
#include <optional>
#include <string>

namespace aerobase {

class BrandingService {
public:
    std::optional<TenantBranding> getBrandingByTenant(const std::string& tenantId);
    std::optional<TenantBranding> getBrandingByDomain(const std::string& domain);
};

}