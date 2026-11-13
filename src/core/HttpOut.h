#pragma once
#include <drogon/drogon.h>
#include <trantor/net/EventLoopThread.h>
#include <memory>
#include <string>
#include <map>

// Blocking outbound HTTP(S) POST for handlers that need the provider's answer (payments).
// Uses a dedicated event loop so it is safe to call from a Drogon IO thread.
namespace httpout {
struct Result { bool ok = false; int status = 0; std::string body; };

inline trantor::EventLoop* loop() {
    static trantor::EventLoopThread t("httpout"); static bool started = (t.run(), true); (void)started;
    return t.getLoop();
}
inline Result post(const std::string& base, const std::string& path, const std::string& contentType, const std::string& body,
                   const std::map<std::string, std::string>& headers, double timeoutSec = 10.0) {
    Result r;
    auto client = drogon::HttpClient::newHttpClient(base, loop());
    auto req = drogon::HttpRequest::newHttpRequest();
    req->setMethod(drogon::Post); req->setPath(path); req->setContentTypeString(contentType); req->setBody(body);
    for (const auto& h : headers) req->addHeader(h.first, h.second);
    auto res = client->sendRequest(req, timeoutSec);
    if (res.first != drogon::ReqResult::Ok || !res.second) return r;
    r.ok = true; r.status = static_cast<int>(res.second->statusCode()); r.body = std::string(res.second->body());
    return r;
}
inline std::string base64(const std::string& in) {
    static const char* t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string o; int val = 0, bits = -6;
    for (unsigned char c : in) { val = (val << 8) + c; bits += 8; while (bits >= 0) { o.push_back(t[(val >> bits) & 0x3F]); bits -= 6; } }
    if (bits > -6) o.push_back(t[((val << 8) >> (bits + 8)) & 0x3F]);
    while (o.size() % 4) o.push_back('=');
    return o;
}
inline std::string urlEncode(const std::string& s) {
    static const char* hex = "0123456789ABCDEF"; std::string o;
    for (unsigned char c : s) { if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') o.push_back(static_cast<char>(c)); else { o.push_back('%'); o.push_back(hex[c >> 4]); o.push_back(hex[c & 15]); } }
    return o;
}
}
