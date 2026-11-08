#pragma once
#include <drogon/HttpController.h>
using namespace drogon;

class NotificationController : public HttpController<NotificationController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(NotificationController::sendEmail,  "/notify/email",       Post);
        ADD_METHOD_TO(NotificationController::getQueue,   "/notify/queue",       Get);
        ADD_METHOD_TO(NotificationController::testDelay,  "/notify/test/delay",  Post);
        ADD_METHOD_TO(NotificationController::testBilling,"/notify/test/billing",Post);
    METHOD_LIST_END

    void sendEmail(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& cb);
    void getQueue(const HttpRequestPtr& req,
                  std::function<void(const HttpResponsePtr&)>&& cb);
    void testDelay(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& cb);
    void testBilling(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& cb);
};
