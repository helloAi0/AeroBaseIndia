#pragma once
#include <drogon/HttpController.h>
using namespace drogon;

class SmsController : public HttpController<SmsController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(SmsController::sendSms,   "/notify/sms",        Post);
        ADD_METHOD_TO(SmsController::smsStatus, "/notify/sms/status", Get);
    METHOD_LIST_END
    void sendSms(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb);
    void smsStatus(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& cb);
};
