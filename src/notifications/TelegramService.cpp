#include "TelegramService.h"
#include <drogon/drogon.h>
#include <cstdlib>
#include <regex>

using namespace drogon;

static std::string envv(const char* k, const char* d = "") { const char* v = std::getenv(k); return v ? v : d; }

bool TelegramService::configured() { return !envv("TELEGRAM_BOT_TOKEN").empty(); }

bool TelegramService::isValidChatId(const std::string& c) {
    static const std::regex re(R"(^(-?[0-9]{5,20}|@[A-Za-z][A-Za-z0-9_]{4,31})$)");
    return std::regex_match(c, re);
}

void TelegramService::send(const std::string& chat, const std::string& text, std::function<void(TgResult)>&& doneIn) {
    auto done = std::make_shared<std::function<void(TgResult)>>(std::move(doneIn));
    TgResult r; r.chat = chat;
    if (!isValidChatId(chat)) { r.error = "Invalid Telegram chat id"; (*done)(r); return; }
    if (!configured()) { r.error = "Telegram is not configured"; (*done)(r); return; }

    Json::Value body; body["chat_id"] = chat; body["text"] = text; body["disable_web_page_preview"] = true;
    auto client = HttpClient::newHttpClient(envv("TELEGRAM_API_BASE", "https://api.telegram.org"));
    auto req = HttpRequest::newHttpJsonRequest(body);
    req->setMethod(Post);
    req->setPath("/bot" + envv("TELEGRAM_BOT_TOKEN") + "/sendMessage");   // token is never logged

    client->sendRequest(req, [done, r](ReqResult res, const HttpResponsePtr& resp) mutable {
        if (res != ReqResult::Ok || !resp) { r.error = "Telegram unreachable"; (*done)(r); return; }
        auto j = resp->getJsonObject();
        if (resp->statusCode() == 200 && j && (*j).get("ok", false).asBool()) r.ok = true;
        else if (resp->statusCode() == 403) r.error = "Recipient has not started the bot (or blocked it)";
        else if (resp->statusCode() == 400) r.error = "Telegram rejected the chat id";
        else if (resp->statusCode() == 401) r.error = "Telegram bot token is invalid";
        else if (resp->statusCode() == 429) r.error = "Telegram rate limit, retry shortly";
        else r.error = "Telegram error " + std::to_string(resp->statusCode());
        (*done)(r);
    }, 8.0);
}
