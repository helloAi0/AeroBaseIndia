#include "../services/BrandingService.h"
#include <drogon/drogon.h>

using namespace drogon;
using namespace aerobase;

void registerBrandingRoutes() {
    app().registerHandler("/api/public/branding",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback) {

            auto domain = req->getHeader("Host");

            BrandingService service;
            auto branding = service.getBrandingByDomain(domain);

            Json::Value response;
            if (branding) {
                response["company_name"] = branding->companyName;
                response["logo_url"] = branding->logoUrl;
                response["primary_color"] = branding->primaryColor;
                response["secondary_color"] = branding->secondaryColor;
                response["support_email"] = branding->supportEmail;
                response["timezone"] = branding->timezone;
                response["language"] = branding->language;
            }

            auto resp = HttpResponse::newHttpJsonResponse(response);
            callback(resp);
        },
        {Get});
}