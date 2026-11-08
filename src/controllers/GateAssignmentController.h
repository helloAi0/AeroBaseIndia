#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class GateAssignmentController : public HttpController<GateAssignmentController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(GateAssignmentController::getGate, "/api/partner/flights/{1}/gate", Get, "PartnerAuthFilter");
    METHOD_LIST_END

    void getGate(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, std::string flightId);
};