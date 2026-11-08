#pragma once

#include <drogon/HttpController.h>
#include "../services/DigitalTwinService.hpp"

using namespace drogon;

class DigitalTwinController : public HttpController<DigitalTwinController>
{
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(DigitalTwinController::getTwinState, "/api/twin/state", Get);
    METHOD_LIST_END

    void getTwinState(
        const HttpRequestPtr& req,
        std::function<void(const HttpResponsePtr&)>&& callback
    );

private:
    DigitalTwinService twinService;
};