#include "PaymentController.h"
#include "../payments/PaymentService.h"
#include "../notifications/EmailService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <json/json.h>
#include <pqxx/pqxx>

using namespace drogon;

void PaymentController::createOrder(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto json = req->getJsonObject();
    if (!json) {
        Json::Value e; e["error"] = "Invalid JSON";
        auto r = HttpResponse::newHttpJsonResponse(e);
        r->setStatusCode(k400BadRequest);
        cb(r); return;
    }

    std::string tenantId  = req->getHeader("X-Tenant-ID");
    std::string invoiceId = (*json).get("invoice_id", "").asString();
    double      amount    = (*json).get("amount",     0.0).asDouble();
    std::string currency  = (*json).get("currency",   "INR").asString();
    std::string gw        = (*json).get("gateway",    "razorpay").asString();
    std::string notifyTo  = (*json).get("notify_email","").asString();

    if (invoiceId.empty() || amount <= 0) {
        Json::Value e;
        e["error"] = "invoice_id and amount are required";
        auto r = HttpResponse::newHttpJsonResponse(e);
        r->setStatusCode(k400BadRequest);
        cb(r); return;
    }

    auto gateway = (gw == "stripe")
        ? PaymentGateway::STRIPE
        : PaymentGateway::RAZORPAY;

    auto order = PaymentService::createOrder(
        tenantId, invoiceId, amount, currency, gateway);

    // Send billing email if requested
    if (!notifyTo.empty()) {
        EmailService::sendBillingInvoice(notifyTo, invoiceId, amount, tenantId);
    }

    Json::Value res;
    res["order_id"]     = order.orderId;
    res["invoice_id"]   = order.invoiceId;
    res["amount"]       = order.amount;
    res["currency"]     = order.currency;
    res["status"]       = order.status;
    res["gateway"]      = order.gateway;
    res["gateway_ref"]  = order.gatewayRef;
    res["checkout_url"] = order.checkoutUrl;
    res["message"]      = "Use checkout_url to complete payment";
    cb(HttpResponse::newHttpJsonResponse(res));
}

void PaymentController::getOrder(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb,
    std::string orderId)
{
    auto result = PaymentService::getOrderStatus(orderId);
    auto resp   = HttpResponse::newHttpJsonResponse(result);
    if (result.isMember("error"))
        resp->setStatusCode(k404NotFound);
    cb(resp);
}

void PaymentController::webhookRazorpay(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    std::string payload   = std::string(req->body());
    std::string signature = req->getHeader("X-Razorpay-Signature");

    auto result = PaymentService::verifyWebhook(
        payload, signature, PaymentGateway::RAZORPAY);

    Json::Value res;
    if (result.success) {
        res["status"]  = "verified";
        res["payment"] = result.gatewayPaymentId;
        core::Logger::info("[Webhook] Razorpay payment verified");
    } else {
        res["status"] = "rejected";
        res["error"]  = result.error;
        auto r = HttpResponse::newHttpJsonResponse(res);
        r->setStatusCode(k400BadRequest);
        cb(r); return;
    }
    cb(HttpResponse::newHttpJsonResponse(res));
}

void PaymentController::webhookStripe(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    std::string payload   = std::string(req->body());
    std::string signature = req->getHeader("Stripe-Signature");

    auto result = PaymentService::verifyWebhook(
        payload, signature, PaymentGateway::STRIPE);

    Json::Value res;
    if (result.success) {
        res["status"]  = "verified";
        res["payment"] = result.gatewayPaymentId;
        core::Logger::info("[Webhook] Stripe payment verified");
    } else {
        res["status"] = "rejected";
        res["error"]  = result.error;
        auto r = HttpResponse::newHttpJsonResponse(res);
        r->setStatusCode(k400BadRequest);
        cb(r); return;
    }
    cb(HttpResponse::newHttpJsonResponse(res));
}

void PaymentController::listOrders(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    std::string tenantId = req->getHeader("X-Tenant-ID");
    Json::Value orders(Json::arrayValue);
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT id, invoice_id, amount, currency, status, gateway, "
            "gateway_ref, checkout_url "
            "FROM payment_orders WHERE tenant_id=$1 "
            "ORDER BY created_at DESC LIMIT 50",
            tenantId);
        for (const auto& row : r) {
            Json::Value o;
            o["order_id"]    = row[0].c_str();
            o["invoice_id"]  = row[1].c_str();
            o["amount"]      = row[2].as<double>();
            o["currency"]    = row[3].c_str();
            o["status"]      = row[4].c_str();
            o["gateway"]     = row[5].c_str();
            o["gateway_ref"] = row[6].c_str();
            o["checkout_url"]= row[7].c_str();
            orders.append(o);
        }
    } catch (const std::exception& e) {
        core::Logger::error("[Payment] listOrders: " + std::string(e.what()));
    }
    Json::Value res;
    res["tenant_id"] = tenantId;
    res["count"]     = (int)orders.size();
    res["orders"]    = orders;
    cb(HttpResponse::newHttpJsonResponse(res));
}
