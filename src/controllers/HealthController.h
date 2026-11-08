#pragma once
#include "../gateway/ApiGateway.h"
#include <drogon/HttpController.h>

using namespace drogon;

class HealthController : public HttpController<HealthController> {
public:
    METHOD_LIST_BEGIN
        // Map the /health endpoint to the checkHealth function
        ADD_METHOD_TO(HealthController::checkHealth, "/health", Get);
    METHOD_LIST_END

    void checkHealth(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& callback);
};