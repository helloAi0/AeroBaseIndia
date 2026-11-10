#include "SmsController.h"
#include "../notifications/SmsService.h"
#include "../notifications/TelegramService.h"
#include "../services/JwtService.h"
#include <chrono>
#include <deque>
#include <map>
#include <mutex>

using namespace drogon;

namespace {
HttpResponsePtr err(HttpStatusCode c, const std::string& m) {
    Json::Value e; e["error"] = m;
    auto r = HttpResponse::newHttpJsonResponse(e); r->setStatusCode(c); return r;
}

// Authenticate and require an admin role. Returns false and fills `out` on failure.
bool authorize(const HttpRequestPtr& req, std::string& tenant, std::string& user, HttpResponsePtr& out) {
    try {
        const std::string h = req->getHeader("Authorization");
        if (h.rfind("Bearer ", 0) != 0 || h.size() <= 7) throw std::runtime_error("no token");
        auto d = JwtService::verifyToken(h.substr(7));
        const std::string role = d.get_payload_claim("role").as_string();
        if (role != "AIRPORT_ADMIN" && role != "SUPER_ADMIN") { out = err(k403Forbidden, "Forbidden"); return false; }
        tenant = d.has_payload_claim("tenant_id") ? d.get_payload_claim("tenant_id").as_string() : "";
        user = d.get_payload_claim("user_id").as_string();
        return true;
    } catch (const std::exception&) {
        out = err(k401Unauthorized, "Unauthorized"); return false;
    }
}

// Per-tenant sliding window: max kMaxPerMinute messages per minute.
constexpr size_t kMaxPerMinute = 60;
std::mutex gMu;
std::map<std::string, std::deque<std::chrono::steady_clock::time_point>> gSent;
bool reserve(const std::string& tenant, size_t n) {
    std::lock_guard<std::mutex> l(gMu);
    auto& q = gSent[tenant]; auto now = std::chrono::steady_clock::now();
    while (!q.empty() && now - q.front() > std::chrono::seconds(60)) q.pop_front();
    if (q.size() + n > kMaxPerMinute) return false;
    for (size_t i = 0; i < n; ++i) q.push_back(now);
    return true;
}
} // namespace

void SmsController::smsStatus(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
    std::string t, u; HttpResponsePtr bad;
    if (!authorize(req, t, u, bad)) { cb(bad); return; }
    Json::Value j; j["provider"] = SmsService::providerName(); j["dry_run"] = SmsService::providerName() == "log";
    j["telegram_configured"] = TelegramService::configured();
    cb(HttpResponse::newHttpJsonResponse(j));
}

void SmsController::sendSms(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
    std::string tenant, user; HttpResponsePtr bad;
    if (!authorize(req, tenant, user, bad)) { cb(bad); return; }

    auto json = req->getJsonObject();
    if (!json || !(*json)["to"].isArray() || !(*json)["message"].isString()) {
        cb(err(k400BadRequest, "Body must be {\"to\": [\"+91...\"], \"message\": \"...\"}")); return;
    }
    const std::string msg = (*json)["message"].asString();
    const auto& to = (*json)["to"];
    if (msg.empty() || msg.size() > 320) { cb(err(k400BadRequest, "message must be 1-320 characters")); return; }
    if (to.empty() || to.size() > 50) { cb(err(k400BadRequest, "'to' must contain 1-50 numbers")); return; }
    if (!reserve(tenant, to.size())) { cb(err(k429TooManyRequests, "SMS rate limit reached (60/minute). Try again shortly.")); return; }

    struct Agg { Json::Value results{Json::arrayValue}; size_t left; int sent = 0; std::function<void(const HttpResponsePtr&)> cb; std::mutex m; };
    auto agg = std::make_shared<Agg>(); agg->left = to.size(); agg->cb = std::move(cb);
    LOG_INFO << "SMS batch tenant=" << tenant << " user=" << user << " n=" << to.size();

    for (const auto& n : to) {
        SmsService::send(n.isString() ? n.asString() : "", msg, [agg](SmsResult r) {
            std::lock_guard<std::mutex> l(agg->m);
            Json::Value x; x["to"] = SmsService::mask(r.to); x["ok"] = r.ok;
            if (r.ok) { agg->sent++; x["id"] = r.sid; } else x["error"] = r.error;
            agg->results.append(x);
            if (--agg->left == 0) {
                Json::Value out; out["provider"] = SmsService::providerName();
                out["sent"] = agg->sent; out["failed"] = (int)agg->results.size() - agg->sent;
                out["results"] = agg->results;
                agg->cb(HttpResponse::newHttpJsonResponse(out));
            }
        });
    }
}

void SmsController::sendTelegram(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
    std::string tenant, user; HttpResponsePtr bad;
    if (!authorize(req, tenant, user, bad)) { cb(bad); return; }
    auto json = req->getJsonObject();
    if (!json || !(*json)["to"].isArray() || !(*json)["message"].isString()) {
        cb(err(k400BadRequest, "Body must be {\"to\": [\"<chat id>\"], \"message\": \"...\"}")); return;
    }
    const std::string msg = (*json)["message"].asString();
    const auto& to = (*json)["to"];
    if (msg.empty() || msg.size() > 4000) { cb(err(k400BadRequest, "message must be 1-4000 characters")); return; }
    if (to.empty() || to.size() > 50) { cb(err(k400BadRequest, "'to' must contain 1-50 chat ids")); return; }
    if (!TelegramService::configured()) { cb(err(k503ServiceUnavailable, "Telegram is not configured")); return; }
    if (!reserve(tenant, to.size())) { cb(err(k429TooManyRequests, "Rate limit reached (60/minute). Try again shortly.")); return; }

    struct Agg { Json::Value results{Json::arrayValue}; size_t left; int sent = 0; std::function<void(const HttpResponsePtr&)> cb; std::mutex m; };
    auto agg = std::make_shared<Agg>(); agg->left = to.size(); agg->cb = std::move(cb);
    for (const auto& n : to) {
        TelegramService::send(n.isString() ? n.asString() : "", msg, [agg](TgResult r) {
            std::lock_guard<std::mutex> l(agg->m);
            Json::Value x; x["to"] = r.chat.size() > 4 ? "***" + r.chat.substr(r.chat.size() - 4) : "***"; x["ok"] = r.ok;
            if (r.ok) agg->sent++; else x["error"] = r.error;
            agg->results.append(x);
            if (--agg->left == 0) {
                Json::Value out; out["provider"] = "telegram"; out["sent"] = agg->sent;
                out["failed"] = (int)agg->results.size() - agg->sent; out["results"] = agg->results;
                agg->cb(HttpResponse::newHttpJsonResponse(out));
            }
        });
    }
}
