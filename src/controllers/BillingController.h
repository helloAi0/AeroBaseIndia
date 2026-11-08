#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class BillingController : public HttpController<BillingController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(BillingController::getInvoices, "/api/billing/invoices", Get, "AuthFilter");
        ADD_METHOD_TO(BillingController::getCurrentPlan, "/api/billing/current-plan", Get, "AuthFilter");
    METHOD_LIST_END

    void getInvoices(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
    void getCurrentPlan(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
};