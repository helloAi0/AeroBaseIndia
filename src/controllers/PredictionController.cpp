#include "PredictionController.h"
#include "../services/DelayPredictionService.h"
#include <json/json.h>

using namespace drogon;

void PredictionController::predictDelay(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto json = req->getJsonObject();
    auto fail = [&](HttpStatusCode code, const char* msg) {
        Json::Value e; e["error"] = msg;
        auto r = HttpResponse::newHttpJsonResponse(e);
        r->setStatusCode(code);
        callback(r);
    };
    if (!json) { fail(k400BadRequest, "JSON body required"); return; }
    double weather    = (*json).get("weather_score",    5.0).asDouble();
    double congestion = (*json).get("congestion_score", 5.0).asDouble();
    if (weather < 0 || weather > 10 || congestion < 0 || congestion > 10) {
        fail(k400BadRequest, "weather_score and congestion_score must be between 0 and 10"); return;
    }

    DelayPredictionService::predictDelayDetailed(weather, congestion,
        [cb = std::move(callback)](bool ok, int delayMins, const std::string& model) mutable {
            Json::Value res;
            if (!ok) {
                res["error"] = "Prediction service unavailable";
                auto r = HttpResponse::newHttpJsonResponse(res);
                r->setStatusCode(k503ServiceUnavailable);
                cb(r); return;
            }
            res["predicted_delay_minutes"] = delayMins;
            res["model_used"] = model;
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
