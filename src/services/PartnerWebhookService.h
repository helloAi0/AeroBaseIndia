#pragma once
#include <string>
#include <json/json.h>

class PartnerWebhookService {
public:
    // Fire-and-forget method with internal retry logic
    static void sendWebhook(const std::string& partnerId, const Json::Value& payload, int attempt = 1);
};