#include "BrandingService.h"

namespace aerobase {

std::optional<TenantBranding> BrandingService::getBrandingByTenant(const std::string& tenantId) {
    TenantBranding branding;
    branding.id = "demo-brand-id";
    branding.tenantId = tenantId;
    branding.companyName = "AeroBase India";
    branding.logoUrl = "/assets/logo.png";
    branding.primaryColor = "#0052cc";
    branding.secondaryColor = "#ffffff";
    branding.supportEmail = "support@aerobase.com";
    branding.customDomain = "demo.aerobase.com";
    branding.timezone = "Asia/Kolkata";
    branding.language = "en";

    return branding;
}

std::optional<TenantBranding> BrandingService::getBrandingByDomain(const std::string& domain) {
    TenantBranding branding;
    branding.id = "demo-brand-id";
    branding.tenantId = "demo-tenant";
    branding.companyName = "AeroBase India";
    branding.logoUrl = "/assets/logo.png";
    branding.primaryColor = "#0052cc";
    branding.secondaryColor = "#ffffff";
    branding.supportEmail = "support@aerobase.com";
    branding.customDomain = domain;
    branding.timezone = "Asia/Kolkata";
    branding.language = "en";

    return branding;
}

}