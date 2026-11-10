#include "HealthController.h"
#include "../tracing/TraceContext.h"
#include "../metrics/MetricsRegistry.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <pqxx/pqxx>
#include <json/json.h>
#include <ctime>
#include <chrono>
#include <cstdlib>
#include <mutex>
#include <map>
#include <netdb.h>
#include <poll.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/socket.h>

using namespace drogon;

namespace {
// Real reachability probe (TCP connect, 300 ms timeout), cached for 5 s so /health stays cheap.
bool tcpReachable(const std::string& host, const std::string& port) {
    static std::mutex mu; static std::map<std::string, std::pair<std::chrono::steady_clock::time_point, bool>> cache;
    const std::string key = host + ":" + port; const auto now = std::chrono::steady_clock::now();
    { std::lock_guard<std::mutex> l(mu); auto it = cache.find(key); if (it != cache.end() && now - it->second.first < std::chrono::seconds(5)) return it->second.second; }
    bool ok = false;
    addrinfo hints{}, *res = nullptr; hints.ai_socktype = SOCK_STREAM;
    if (getaddrinfo(host.c_str(), port.c_str(), &hints, &res) == 0 && res) {
        int fd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
        if (fd >= 0) {
            fcntl(fd, F_SETFL, O_NONBLOCK);
            int rc = connect(fd, res->ai_addr, res->ai_addrlen);
            if (rc == 0) ok = true;
            else if (errno == EINPROGRESS) {
                pollfd p{fd, POLLOUT, 0};
                if (poll(&p, 1, 300) == 1) { int err = 0; socklen_t l = sizeof(err); getsockopt(fd, SOL_SOCKET, SO_ERROR, &err, &l); ok = (err == 0); }
            }
            close(fd);
        }
        freeaddrinfo(res);
    }
    std::lock_guard<std::mutex> l(mu); cache[key] = {now, ok}; return ok;
}
std::string envOr(const char* k, const char* d) { const char* v = std::getenv(k); return (v && *v) ? v : d; }
// Host/port from "http://host:port" (ML_SERVICE_URL)
std::pair<std::string, std::string> hostPortOf(std::string url) {
    auto p = url.find("://"); if (p != std::string::npos) url = url.substr(p + 3);
    auto slash = url.find('/'); if (slash != std::string::npos) url = url.substr(0, slash);
    auto colon = url.rfind(':'); if (colon == std::string::npos) return {url, "80"};
    return {url.substr(0, colon), url.substr(colon + 1)};
}
}

void HealthController::checkHealth(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& callback)
{
    auto span = Tracer::getInstance().startSpan("GET /health");
    Tracer::addTag(span, "http.path", "/health");
    MetricsRegistry::getInstance().incrementCounter(
        "aerobase_http_requests_total",
        "{path=\"/health\",method=\"GET\",status=\"200\"}");
    Json::Value result;
    result["service"]   = "AeroBase India";
    result["timestamp"] = (Json::Int64)std::time(nullptr);

    std::string dbStatus = "DOWN";
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        txn.exec("SELECT 1");
        dbStatus = "UP";
    } catch (const std::exception& e) {
        core::Logger::error("[Health] DB: " + std::string(e.what()));
    }
    result["database"]  = dbStatus;
    result["redis"]     = tcpReachable(envOr("REDIS_HOST", "localhost"), envOr("REDIS_PORT", "6379")) ? "UP" : "DOWN";
    auto ml = hostPortOf(envOr("ML_SERVICE_URL", "http://localhost:5000"));
    result["ai_engine"] = tcpReachable(ml.first, ml.second) ? "UP" : "DOWN";

    // Only the database is required to serve traffic; Redis / ML being down is reported but not fatal.
    bool ok = (dbStatus == "UP");
    result["status"] = ok ? "healthy" : "degraded";
    if (!ok) core::Logger::warn("[Health] DB check failed");

    auto resp = HttpResponse::newHttpJsonResponse(result);
    resp->setStatusCode(ok ? k200OK : k503ServiceUnavailable);
    Tracer::getInstance().finishSpan(span, ok ? 200 : 503);
    callback(resp);
}
