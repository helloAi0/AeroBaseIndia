#pragma once

#include <drogon/HttpController.h>

using namespace drogon;

class AirlineBaggageController {
public:
    static void syncBaggage(
        const HttpRequestPtr& req,
        std::function<void(const HttpResponsePtr&)>&& callback
    );
};