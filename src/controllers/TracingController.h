#pragma once
#include <drogon/HttpController.h>
using namespace drogon;

class TracingController : public HttpController<TracingController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(TracingController::getTraces, "/traces",       Get);
        ADD_METHOD_TO(TracingController::getTrace,  "/traces/{1}",   Get);
    METHOD_LIST_END

    void getTraces(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& cb);
    void getTrace(const HttpRequestPtr& req,
                  std::function<void(const HttpResponsePtr&)>&& cb,
                  std::string traceId);
};
