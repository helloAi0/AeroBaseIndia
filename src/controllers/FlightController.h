#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class FlightController : public HttpController<FlightController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(FlightController::getFlights, "/flights", Get);
        ADD_METHOD_TO(FlightController::addFlight, "/flights", Post);
        ADD_METHOD_TO(FlightController::getLiveStatus, "/flights/{1}/live", Get);
    METHOD_LIST_END

    void getFlights(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void addFlight(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    
    // This MUST match the .cc file exactly
    void getLiveStatus(const HttpRequestPtr& req,
                       std::function<void(const HttpResponsePtr&)>&& callback,
                       std::string flightId);
};