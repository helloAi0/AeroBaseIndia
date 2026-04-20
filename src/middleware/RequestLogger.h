#pragma once
#include <drogon/HttpMiddleware.h>
#include "../core/Logger.h"

using namespace drogon;

class RequestLogger : public HttpMiddleware<RequestLogger> {
public:
    void invoke(const HttpRequestPtr& req,
                MiddlewareNextCallback&& next,
                MiddlewareCallback&&) override {
        Logger::info(req->methodString() + " " + req->path());
        next(req);
    }
};