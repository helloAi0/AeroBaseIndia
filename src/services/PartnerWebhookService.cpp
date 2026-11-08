#include "PartnerWebhookService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <drogon/HttpClient.h>
#include <drogon/drogon.h>

void PartnerWebhookService::sendWebhook(const std::string& partnerId, const Json::Value& payload, int attempt) {
    if (attempt > 3) {
        Logger::error("Webhook delivery failed after 3 attempts for partner: " + partnerId);
        return; // MAANG Logic: Dead-letter queue goes here in a real system
    }

    // Fetch URL from DB (Ideally, this is cached in Redis)
    std::string webhookUrl = "https://partner-api.com/webhook"; // Mocked for example

    auto client = drogon::HttpClient::newHttpClient(webhookUrl);
    auto req = drogon::HttpRequest::newHttpJsonRequest(payload);
    req->setMethod(drogon::Post);

    client->sendRequest(req, [partnerId, payload, attempt](drogon::ReqResult result, const drogon::HttpResponsePtr& resp) {
        if (result == drogon::ReqResult::Ok && resp->getStatusCode() == drogon::k200OK) {
            Logger::info("Webhook delivered successfully to partner: " + partnerId);
        } else {
            Logger::warn("Webhook failed. Retrying... Attempt " + std::to_string(attempt + 1));
            // Exponential Backoff: Retry after 5, 10, then 15 seconds
            drogon::app().getLoop()->runAfter(5.0 * attempt, [partnerId, payload, attempt]() {
                sendWebhook(partnerId, payload, attempt + 1);
            });
        }
    });
}