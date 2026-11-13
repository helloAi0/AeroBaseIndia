#pragma once
#include <drogon/HttpController.h>
using namespace drogon;

class PaymentController : public HttpController<PaymentController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(PaymentController::createOrder,   "/payments/order",           Post);
        ADD_METHOD_TO(PaymentController::getOrder,      "/payments/order/{1}",       Get);
        ADD_METHOD_TO(PaymentController::webhookRazorpay,"/payments/webhook/razorpay",Post);
        ADD_METHOD_TO(PaymentController::webhookStripe, "/payments/webhook/stripe",  Post);
        ADD_METHOD_TO(PaymentController::listOrders,    "/payments/orders",          Get);
        ADD_METHOD_TO(PaymentController::config,        "/payments/config",          Get);
    METHOD_LIST_END

    void createOrder(const HttpRequestPtr& req,
                     std::function<void(const HttpResponsePtr&)>&& cb);
    void getOrder(const HttpRequestPtr& req,
                  std::function<void(const HttpResponsePtr&)>&& cb,
                  std::string orderId);
    void webhookRazorpay(const HttpRequestPtr& req,
                          std::function<void(const HttpResponsePtr&)>&& cb);
    void webhookStripe(const HttpRequestPtr& req,
                       std::function<void(const HttpResponsePtr&)>&& cb);
    void listOrders(const HttpRequestPtr& req,
                    std::function<void(const HttpResponsePtr&)>&& cb);
    void config(const HttpRequestPtr& req,
                std::function<void(const HttpResponsePtr&)>&& cb);
};
