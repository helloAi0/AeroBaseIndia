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

void DelayPredictionService::predictDelay(double weather,
                                           double congestion,
                                           std::function<void(int)>&& callback) {
    auto cb = std::move(callback);

    Json::Value body;
    body["weather"]    = weather;
    body["congestion"] = congestion;

    auto client = drogon::HttpClient::newHttpClient(mlServiceUrl());
    auto req    = drogon::HttpRequest::newHttpJsonRequest(body);
    req->setMethod(drogon::HttpMethod::Post);
    req->setPath("/predict");

    client->sendRequest(req,
        [cb = std::move(cb)](drogon::ReqResult res,
                              const drogon::HttpResponsePtr& resp) mutable {
            if (res != drogon::ReqResult::Ok || !resp) { cb(0); return; }
            auto json = resp->getJsonObject();
            if (!json || !json->isMember("predicted_delay_minutes")) { cb(0); return; }
            cb((*json)["predicted_delay_minutes"].asInt());
        });
}