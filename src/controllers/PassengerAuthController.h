#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class PassengerAuthController : public drogon::HttpController<PassengerAuthController>
{
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(PassengerAuthController::registerPassenger, "/api/passenger/register", Post);
    ADD_METHOD_TO(PassengerAuthController::loginPassenger, "/api/passenger/login", Post);
    METHOD_LIST_END

    void registerPassenger(const HttpRequestPtr& req,
                           std::function<void(const HttpResponsePtr&)>&& callback);

    void loginPassenger(const HttpRequestPtr& req,
                        std::function<void(const HttpResponsePtr&)>&& callback);
};