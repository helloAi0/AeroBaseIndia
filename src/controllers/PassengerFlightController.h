#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class PassengerFlightController : public drogon::HttpController<PassengerFlightController>
{
public:
    METHOD_LIST_BEGIN
    // Public/Passenger endpoint to view the flight board
    ADD_METHOD_TO(PassengerFlightController::getPassengerFlights, "/api/passenger/flights", Get);
    METHOD_LIST_END

    void getPassengerFlights(const HttpRequestPtr& req,
                             std::function<void(const HttpResponsePtr&)>&& callback);
};