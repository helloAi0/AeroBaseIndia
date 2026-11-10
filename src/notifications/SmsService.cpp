#include "SmsService.h"
#include <drogon/drogon.h>
#include <cstdlib>
#include <regex>

using namespace drogon;

static std::string env(const char* k, const char* d = "") {
    const char* v = std::getenv(k);
    return v ? v : d;
}

std::string SmsService::providerName() {
    std::string p = env("SMS_PROVIDER", "log");
    return p == "twilio" ? "twilio" : "log";
}

bool SmsService::isValidE164(const std::string& n) {
    static const std::regex re(R"(^\+[1-9][0-9]{7,14}$)");
    return std::regex_match(n, re);
}

std::string SmsService::mask(const std::string& n) {
    if (n.size() < 8) return "***";
    return n.substr(0, 3) + "*****" + n.substr(n.size() - 4);
}

static std::string urlEncode(const std::string& s) {
    static const char* hex = "0123456789ABCDEF";
    std::string o;
    for (unsigned char c : s) {
        if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') o += c;
        else { o += '%'; o += hex[c >> 4]; o += hex[c & 15]; }
    }
    return o;
}

static std::string base64(const std::string& in) {
    static const char* t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string o; int val = 0, bits = -6;
    for (unsigned char c : in) {
        val = (val << 8) + c; bits += 8;
        while (bits >= 0) { o += t[(val >> bits) & 0x3F]; bits -= 6; }
    }
    if (bits > -6) o += t[((val << 8) >> (bits + 8)) & 0x3F];
    while (o.size() % 4) o += '=';
    return o;
}

void SmsService::send(const std::string& to, const std::string& body,
                      std::function<void(SmsResult)>&& doneIn) {
    auto done = std::make_shared<std::function<void(SmsResult)>>(std::move(doneIn));
    SmsResult r; r.to = to;

    if (!isValidE164(to)) { r.error = "Invalid phone number (use +<country code><number>)"; (*done)(r); return; }

    if (providerName() == "log") {
        LOG_INFO << "[SMS dry-run] to=" << mask(to) << " chars=" << body.size();
        r.ok = true; r.sid = "dry-run"; (*done)(r); return;
    }

    const std::string sid = env("TWILIO_ACCOUNT_SID"), token = env("TWILIO_AUTH_TOKEN");
    const std::string msgSvc = env("TWILIO_MESSAGING_SERVICE_SID"), from = env("TWILIO_FROM");
    if (sid.empty() || token.empty() || (msgSvc.empty() && from.empty())) {
        r.error = "SMS provider is not configured"; (*done)(r); return;
    }

    std::string form = "To=" + urlEncode(to) + "&Body=" + urlEncode(body) + "&" +
        (msgSvc.empty() ? "From=" + urlEncode(from) : "MessagingServiceSid=" + urlEncode(msgSvc));

    auto client = HttpClient::newHttpClient(env("TWILIO_API_BASE", "https://api.twilio.com"));
    auto req = HttpRequest::newHttpRequest();
    req->setMethod(Post);
    req->setPath("/2010-04-01/Accounts/" + sid + "/Messages.json");
    req->setContentTypeString("application/x-www-form-urlencoded");
    req->setBody(form);
    req->addHeader("Authorization", "Basic " + base64(sid + ":" + token));

    client->sendRequest(req, [done, r](ReqResult res, const HttpResponsePtr& resp) mutable {
        if (res != ReqResult::Ok || !resp) { r.error = "SMS provider unreachable"; (*done)(r); return; }
        auto j = resp->getJsonObject();
        if (resp->statusCode() >= 200 && resp->statusCode() < 300) {
            r.ok = true; if (j) r.sid = (*j).get("sid", "").asString();
        } else {
            int code = j ? (*j).get("code", 0).asInt() : 0;
            r.error = (code == 21608) ? "Trial account: recipient number is not verified in Twilio (upgrade the account to message any number)"
                    : (code == 21211 ? "Provider rejected the number"
                    : "Provider error " + std::to_string(resp->statusCode()) + (code ? " (code " + std::to_string(code) + ")" : ""));
        }
        (*done)(r);
    }, 8.0);
}
