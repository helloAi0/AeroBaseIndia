#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class BaggageTrackingController : public drogon::HttpController<BaggageTrackingController>
{
public:
    METHOD_LIST_BEGIN
    // Dynamic route for specific baggage tag tracking
    ADD_METHOD_TO(BaggageTrackingController::trackBaggage, "/api/passenger/baggage/{1}", Get);
    METHOD_LIST_END

    void trackBaggage(const HttpRequestPtr& req,
                      std::function<void(const HttpResponsePtr&)>&& callback,
                      std::string tagId);
};