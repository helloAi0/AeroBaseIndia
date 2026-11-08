#include "MetricsController.h"
#include "../metrics/MetricsRegistry.h"

void MetricsController::metrics(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    std::string body = MetricsRegistry::getInstance().exportPrometheus();
    auto resp = HttpResponse::newHttpResponse();
    resp->setBody(body);
    // Prometheus requires this exact content type
    resp->setContentTypeString(
        "text/plain; version=0.0.4; charset=utf-8");
    resp->setStatusCode(k200OK);
    callback(resp);
}
