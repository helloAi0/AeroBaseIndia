#include <drogon/drogon.h>
#include "core/Logger.h"
#include "services/JwtService.h"
#include "config/StartupChecks.h"
#include "middleware/RouteGuard.h"

int main() {
    StartupChecks::run();
    JwtService::init();

    // Global CORS middleware
    drogon::app().registerPreRoutingAdvice([](const drogon::HttpRequestPtr& req,
        drogon::AdviceCallback&& cb, drogon::AdviceChainCallback&& ccb) {
        if (req->method() == drogon::HttpMethod::Options) {
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->addHeader("Access-Control-Allow-Origin",  "*");
            resp->addHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
            resp->addHeader("Access-Control-Allow-Headers",
                "Content-Type,Authorization,X-Tenant-ID,X-Request-ID");
            resp->setStatusCode(drogon::k200OK);
            cb(resp);
        } else if (auto denied = routeguard::check(req)) {
            denied->addHeader("Access-Control-Allow-Origin", "*");
            cb(denied);
        } else {
            ccb();
        }
    });

    drogon::app().registerPostHandlingAdvice([](const drogon::HttpRequestPtr&,
        const drogon::HttpResponsePtr& resp) {
        resp->addHeader("Access-Control-Allow-Origin",  "*");
        resp->addHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers",
            "Content-Type,Authorization,X-Tenant-ID,X-Request-ID");
    });

    drogon::app()
        .loadConfigFile("config.json")
        .run();
    return 0;
}
