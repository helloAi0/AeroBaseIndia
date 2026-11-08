#pragma once
#include <drogon/HttpFilter.h>
#include <string>

using namespace drogon;

namespace security {

class InputValidationFilter : public HttpFilter<InputValidationFilter> {
public:
    void doFilter(const HttpRequestPtr& req,
                  FilterCallback&& fcb,
                  FilterChainCallback&& fccb) override {

        constexpr size_t MAX_BODY = 1024 * 1024; // 1MB

        if(req->body().size() > MAX_BODY) {
            auto resp = HttpResponse::newHttpJsonResponse(Json::Value{
                {"error", "Request body too large"}
            });
            resp->setStatusCode(k413RequestEntityTooLarge);
            fcb(resp);
            return;
        }

        std::string body(req->body());

        if(body.find("<script") != std::string::npos ||
           body.find("DROP TABLE") != std::string::npos ||
           body.find("../") != std::string::npos) {
            auto resp = HttpResponse::newHttpJsonResponse(Json::Value{
                {"error", "Invalid request payload"}
            });
            resp->setStatusCode(k400BadRequest);
            fcb(resp);
            return;
        }

        fccb();
    }
};

}
