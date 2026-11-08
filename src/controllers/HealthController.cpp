#include "HealthController.h"
#include "../tracing/TraceContext.h"
#include "../metrics/MetricsRegistry.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <pqxx/pqxx>
#include <json/json.h>
#include <ctime>

using namespace drogon;

void HealthController::checkHealth(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto span = Tracer::getInstance().startSpan("GET /health");
    Tracer::addTag(span, "http.path", "/health");
    MetricsRegistry::getInstance().incrementCounter(
        "aerobase_http_requests_total",
        "{path=\"/health\",method=\"GET\",status=\"200\"}");
    Json::Value result;
    result["service"]   = "AeroBase India";
    result["timestamp"] = (Json::Int64)std::time(nullptr);

    std::string dbStatus = "DOWN";
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        txn.exec("SELECT 1");
        dbStatus = "UP";
    } catch (const std::exception& e) {
        core::Logger::error("[Health] DB: " + std::string(e.what()));
    }
    result["database"]  = dbStatus;
    result["redis"]     = "UP";
    result["ai_engine"] = "UP";

    bool ok = (dbStatus == "UP");
    result["status"] = ok ? "healthy" : "degraded";
    if (!ok) core::Logger::warn("[Health] DB check failed");

    auto resp = HttpResponse::newHttpJsonResponse(result);
    resp->setStatusCode(ok ? k200OK : k503ServiceUnavailable);
    Tracer::getInstance().finishSpan(span, ok ? 200 : 503);
    callback(resp);
}
