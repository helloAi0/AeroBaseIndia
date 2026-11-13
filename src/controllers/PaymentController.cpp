#include "PaymentController.h"
#include "../payments/PaymentService.h"
#include "../notifications/EmailService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <json/json.h>
#include "../middleware/JwtIdentity.h"
#include <pqxx/pqxx>
#include <regex>
#include <cmath>

using namespace drogon;

namespace {
bool adminIdentity(const HttpRequestPtr& req, jwtid::Identity& id, HttpResponsePtr& bad) {
    if (!jwtid::identify(req, id)) { bad = jwtid::error(k401Unauthorized, "Unauthorized"); return false; }
    if (id.role != "AIRPORT_ADMIN" && id.role != "SUPER_ADMIN") { bad = jwtid::error(k403Forbidden, "Forbidden"); return false; }
    return true;
}
}

void PaymentController::createOrder(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    jwtid::Identity id; HttpResponsePtr bad;
    if (!adminIdentity(req, id, bad)) { cb(bad); return; }
    auto json = req->getJsonObject();
    if (!json || !json->isObject()) { cb(jwtid::error(k400BadRequest, "Invalid JSON")); return; }

    const std::string invoiceId = (*json).get("invoice_id", "").asString();
    const double      amount    = (*json).get("amount", 0.0).asDouble();
    const std::string currency  = (*json).get("currency", "INR").asString();
    const std::string gw        = (*json).get("gateway", "razorpay").asString();
    const std::string notifyTo  = (*json).get("notify_email", "").asString();

    static const std::regex inv("^[A-Za-z0-9._/-]{1,60}$"), cur("^[A-Z]{3}$");
    if (!std::regex_match(invoiceId, inv)) { cb(jwtid::error(k400BadRequest, "invoice_id is required (letters, digits, . _ / -)")); return; }
    if (!(amount > 0.0) || amount > 100000000.0 || !std::isfinite(amount)) { cb(jwtid::error(k400BadRequest, "amount must be between 0 and 100,000,000")); return; }
    if (!std::regex_match(currency, cur)) { cb(jwtid::error(k400BadRequest, "currency must be a 3-letter code such as INR")); return; }
    if (gw != "razorpay" && gw != "stripe") { cb(jwtid::error(k400BadRequest, "gateway must be razorpay or stripe")); return; }

    auto order = PaymentService::createOrder(id.tenant, invoiceId, amount, currency,
        gw == "stripe" ? PaymentGateway::STRIPE : PaymentGateway::RAZORPAY);
    if (!order.error.empty()) { cb(jwtid::error(static_cast<HttpStatusCode>(order.httpStatus), order.error.c_str())); return; }

    if (!notifyTo.empty()) EmailService::sendBillingInvoice(notifyTo, invoiceId, amount, id.tenant);

    Json::Value res;
    res["order_id"]     = order.orderId;
    res["invoice_id"]   = order.invoiceId;
    res["amount"]       = order.amount;
    res["currency"]     = order.currency;
    res["status"]       = order.status;
    res["gateway"]      = order.gateway;
    res["gateway_ref"]  = order.gatewayRef;
    if (!order.keyId.empty())        res["key_id"]        = order.keyId;         // for Razorpay Checkout.js
    if (!order.clientSecret.empty()) res["client_secret"] = order.clientSecret;  // for Stripe.js
    cb(HttpResponse::newHttpJsonResponse(res));
}

void PaymentController::getOrder(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb,
    std::string orderId)
{
    jwtid::Identity id; HttpResponsePtr bad;
    if (!adminIdentity(req, id, bad)) { cb(bad); return; }
    auto result = PaymentService::getOrderStatus(orderId, id.tenant);
    auto resp   = HttpResponse::newHttpJsonResponse(result);
    if (result.isMember("error")) resp->setStatusCode(result["error"].asString() == "Order not found" ? k404NotFound : k500InternalServerError);
    cb(resp);
}

void PaymentController::config(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    jwtid::Identity id; HttpResponsePtr bad;
    if (!adminIdentity(req, id, bad)) { cb(bad); return; }
    Json::Value res;
    res["razorpay"] = PaymentService::razorpayConfigured();
    res["razorpay_key_id"] = PaymentService::razorpayConfigured() ? Json::Value(PaymentService::razorpayKeyId()) : Json::Value();
    res["stripe"] = PaymentService::stripeConfigured();
    cb(HttpResponse::newHttpJsonResponse(res));
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
    jwtid::Identity id; HttpResponsePtr bad;
    if (!adminIdentity(req, id, bad)) { cb(bad); return; }
    const std::string tenantId = id.tenant;
    Json::Value orders(Json::arrayValue);
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT id, invoice_id, amount, currency, status, gateway, "
            "gateway_ref "
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
            orders.append(o);
        }
    } catch (const std::exception& e) {
        core::Logger::error("[Payment] listOrders: " + std::string(e.what()));
    }
    Json::Value res;
    res["count"]     = (int)orders.size();
    res["orders"]    = orders;
    cb(HttpResponse::newHttpJsonResponse(res));
}
