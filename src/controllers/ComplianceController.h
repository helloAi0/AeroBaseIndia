#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class ComplianceController : public drogon::HttpController<ComplianceController>
{
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ComplianceController::getSummary, "/api/compliance/summary", Get);
    METHOD_LIST_END

    void getSummary(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback);
};