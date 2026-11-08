#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class AirlineFlightController : public HttpController<AirlineFlightController> {
public:
    METHOD_LIST_BEGIN
        // Notice we apply the "PartnerAuthFilter" directly to this route
        ADD_METHOD_TO(AirlineFlightController::syncFlight, "/api/partner/flights/sync", Post, "PartnerAuthFilter");
    METHOD_LIST_END

    void syncFlight(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
};