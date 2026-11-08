#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class RevenueController : public HttpController<RevenueController> {
public:
    METHOD_LIST_BEGIN
        // Ensure only authenticated users can hit this
        ADD_METHOD_TO(RevenueController::getDashboard, "/api/revenue/dashboard", Get);
    METHOD_LIST_END

    void getDashboard(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
};