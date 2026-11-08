#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class AdminRevenueController : public HttpController<AdminRevenueController> {
public:
    METHOD_LIST_BEGIN
        // Extremely restricted endpoint
        ADD_METHOD_TO(AdminRevenueController::getGlobalMetrics, "/api/internal/saas-metrics", Get);
    METHOD_LIST_END

    void getGlobalMetrics(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
};