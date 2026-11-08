#pragma once

#include <string>

namespace aerobase {

struct TenantBranding {
    std::string id;
    std::string tenantId;
    std::string companyName;
    std::string logoUrl;
    std::string primaryColor;
    std::string secondaryColor;
    std::string supportEmail;
    std::string customDomain;
    std::string timezone;
    std::string language;
};

}