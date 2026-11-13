#include <drogon/drogon.h>
#include <netdb.h>
#include <poll.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/socket.h>
#include <cstdlib>
#include "../middleware/AdminAuth.h"

using namespace drogon;

// GET /api/integrations/status (admin): which external services are configured/reachable. Never returns secrets.
namespace {
bool set(const char* k) { const char* v = std::getenv(k); return v && *v; }
std::string envOr(const char* k, const char* d) { const char* v = std::getenv(k); return (v && *v) ? v : d; }
bool reachable(std::string host, const std::string& port) {
    bool ok = false; addrinfo hints{}, *res = nullptr; hints.ai_socktype = SOCK_STREAM;
    if (getaddrinfo(host.c_str(), port.c_str(), &hints, &res) == 0 && res) {
        int fd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
        if (fd >= 0) {
            fcntl(fd, F_SETFL, O_NONBLOCK); int rc = connect(fd, res->ai_addr, res->ai_addrlen);
            if (rc == 0) ok = true;
            else if (errno == EINPROGRESS) { pollfd p{fd, POLLOUT, 0}; if (poll(&p, 1, 300) == 1) { int e = 0; socklen_t l = sizeof(e); getsockopt(fd, SOL_SOCKET, SO_ERROR, &e, &l); ok = (e == 0); } }
            close(fd);
        }
        freeaddrinfo(res);
    }
    return ok;
}
}

class IntegrationsController : public HttpController<IntegrationsController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(IntegrationsController::status, "/api/integrations/status", Get);
    METHOD_LIST_END

    void status(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb) {
        { HttpResponsePtr bad; if (!adminauth::require(req, bad)) return cb(bad); }
        std::string ml = envOr("ML_SERVICE_URL", "http://localhost:5001"); auto p = ml.find("://"); if (p != std::string::npos) ml = ml.substr(p + 3);
        auto sl = ml.find('/'); if (sl != std::string::npos) ml = ml.substr(0, sl);
        auto co = ml.rfind(':'); const std::string mh = co == std::string::npos ? ml : ml.substr(0, co), mp = co == std::string::npos ? "80" : ml.substr(co + 1);
        Json::Value o;
        o["whatsapp"] = set("WHATSAPP_APP_SECRET") && set("WHATSAPP_TOKEN") && set("WHATSAPP_PHONE_NUMBER_ID") && set("WHATSAPP_VERIFY_TOKEN");
        o["sms"]      = envOr("SMS_PROVIDER", "log") == "twilio" && set("TWILIO_ACCOUNT_SID") && set("TWILIO_AUTH_TOKEN") && (set("TWILIO_FROM") || set("TWILIO_MESSAGING_SERVICE_SID"));
        o["email"]    = set("BREVO_API_KEY") && set("BREVO_SENDER_EMAIL");
        o["razorpay"] = set("RAZORPAY_KEY_ID") && (set("RAZORPAY_KEY_SECRET") || set("RAZORPAY_SECRET"));
        o["stripe"]   = set("STRIPE_SECRET_KEY");
        o["redis"]    = reachable(envOr("REDIS_HOST", "127.0.0.1"), envOr("REDIS_PORT", "6379"));
        o["ml"]       = reachable(mh, mp);
        cb(HttpResponse::newHttpJsonResponse(o));
    }
};
