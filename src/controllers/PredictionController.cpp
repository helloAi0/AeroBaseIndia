#include "PredictionController.h"
#include "../services/DelayPredictionService.h"
#include <json/json.h>

using namespace drogon;

void PredictionController::predictDelay(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto json = req->getJsonObject();
    if (!json) {
        auto r = HttpResponse::newHttpResponse();
        r->setStatusCode(k400BadRequest);
        callback(r); return;
    }
    double weather    = (*json).get("weather_score",    5.0).asDouble();
    double congestion = (*json).get("congestion_score", 5.0).asDouble();

    DelayPredictionService::predictDelay(weather, congestion,
        [cb = std::move(callback)](int delayMins) mutable {
            Json::Value res;
            res["predicted_delay_minutes"] = delayMins;
            res["status"] = "ok";
            cb(HttpResponse::newHttpJsonResponse(res));
        });
}

void PredictionController::runCascade(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto json = req->getJsonObject();
    if (!json) {
        auto r = HttpResponse::newHttpResponse();
        r->setStatusCode(k400BadRequest);
        callback(r); return;
    }
    std::string trigger = (*json).get("trigger_id",      "unknown").asString();
    int         delay   = (*json).get("initial_delay",   0).asInt();

    auto report = SimulationEngine::predictCascadingFailures(trigger, delay);

    Json::Value res;
    res["trigger_id"]        = report.triggerId;
    res["total_delay_added"] = report.totalSystemDelayAdded;
    res["affected_gates"]    = report.affectedGates;
    Json::Value changes(Json::arrayValue);
    for (auto& c : report.recommendedGateChanges) changes.append(c);
    res["gate_changes"] = changes;
    res["status"]       = "cascade_simulated";
    callback(HttpResponse::newHttpJsonResponse(res));
}
