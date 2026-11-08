#pragma once
#include <drogon/HttpController.h>
using namespace drogon;

class SwaggerController : public HttpController<SwaggerController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(SwaggerController::swaggerJson, "/api-docs",     Get);
        ADD_METHOD_TO(SwaggerController::swaggerUi,   "/docs",         Get);
        ADD_METHOD_TO(SwaggerController::redoc,       "/redoc",        Get);
    METHOD_LIST_END

    void swaggerJson(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& cb);
    void swaggerUi(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& cb);
    void redoc(const HttpRequestPtr& req,
               std::function<void(const HttpResponsePtr&)>&& cb);
};
