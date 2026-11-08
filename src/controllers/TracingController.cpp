#include "TracingController.h"
#include "../tracing/TraceContext.h"
#include <json/json.h>

using namespace drogon;

void TracingController::getTraces(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    std::string body = Tracer::getInstance().exportJson(100);
    auto resp = HttpResponse::newHttpResponse();
    resp->setBody(body);
    resp->setContentTypeString("application/json");
    resp->addHeader("Access-Control-Allow-Origin", "*");
    cb(resp);
}

void TracingController::getTrace(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb,
    std::string traceId)
{
    auto all = Tracer::getInstance().getRecentSpans(500);
    std::ostringstream o;
    o << "[";
    bool first = true;
    for (auto& s : all) {
        if (s.traceId != traceId) continue;
        if (!first) o << ",";
        o << s.toJson();
        first = false;
    }
    o << "]";
    auto resp = HttpResponse::newHttpResponse();
    resp->setBody(o.str());
    resp->setContentTypeString("application/json");
    cb(resp);
}
