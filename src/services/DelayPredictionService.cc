#include "DelayPredictionService.h"
#include <drogon/drogon.h>
#include <json/json.h>
#include <iostream>
#include <cstdlib>

std::string& DelayPredictionService::mlServiceUrl() {
    static std::string url = [] {
        const char* env = std::getenv("ML_SERVICE_URL");
        return env ? std::string(env) : "http://localhost:5000";
    }();
    return url;
}

void DelayPredictionService::predictDelayDetailed(
    double weather, double congestion,
    std::function<void(bool, int, const std::string&)>&& callback) {
    auto cb = std::move(callback);

    Json::Value body;
    // ml_service/app.py reads *_score; keep the short names for older ML builds.
    body["weather_score"]    = weather;
    body["congestion_score"] = congestion;
    body["weather"]          = weather;
    body["congestion"]       = congestion;

    auto client = drogon::HttpClient::newHttpClient(mlServiceUrl());
    auto req    = drogon::HttpRequest::newHttpJsonRequest(body);
    req->setMethod(drogon::HttpMethod::Post);
    req->setPath("/predict");

    client->sendRequest(req,
        [cb = std::move(cb)](drogon::ReqResult res, const drogon::HttpResponsePtr& resp) mutable {
            if (res != drogon::ReqResult::Ok || !resp || resp->statusCode() != drogon::k200OK) { cb(false, 0, ""); return; }
            auto json = resp->getJsonObject();
            if (!json || !json->isMember("predicted_delay_minutes")) { cb(false, 0, ""); return; }
            cb(true, (*json)["predicted_delay_minutes"].asInt(), json->get("model_used", "").asString());
        },
        3.0);
}

void DelayPredictionService::predictDelay(double weather,
                                           double congestion,
                                           std::function<void(int)>&& callback) {
    auto cb = std::move(callback);
    predictDelayDetailed(weather, congestion,
        [cb = std::move(cb)](bool, int d, const std::string&) mutable { cb(d); });
}
