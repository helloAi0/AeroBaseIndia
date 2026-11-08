#pragma once
#include <drogon/HttpController.h>
#include "../services/SimulationEngine.h"

using namespace drogon;

class PredictionController : public HttpController<PredictionController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(PredictionController::predictDelay, "/predict/delay",   Post);
        ADD_METHOD_TO(PredictionController::runCascade,   "/predict/cascade", Post);
    METHOD_LIST_END

    void predictDelay(const HttpRequestPtr& req,
                      std::function<void(const HttpResponsePtr&)>&& callback);
    void runCascade(const HttpRequestPtr& req,
                    std::function<void(const HttpResponsePtr&)>&& callback);
};
