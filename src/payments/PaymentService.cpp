#include "PaymentService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include "../core/HttpOut.h"
#include <pqxx/pqxx>
#include <openssl/hmac.h>
#include <openssl/crypto.h>
#include <sstream>
#include <iomanip>
#include <random>
#include <cstdlib>
#include <cmath>
#include <chrono>
#include <ctime>

// ── Config from environment (read at call time; no demo defaults) ─────────────
static std::string env(const char* k, const std::string& fb = "") {
    const char* v = std::getenv(k);
    return (v && *v) ? std::string(v) : fb;
}
static std::string razorpaySecret()   { return env("RAZORPAY_KEY_SECRET", env("RAZORPAY_SECRET")); }
static std::string razorpayWebhook()  { return env("RAZORPAY_WEBHOOK_SECRET", razorpaySecret()); }
static std::string stripeKey()        { return env("STRIPE_SECRET_KEY"); }

std::string PaymentService::razorpayKeyId()     { return env("RAZORPAY_KEY_ID"); }
bool        PaymentService::razorpayConfigured() { return !razorpayKeyId().empty() && !razorpaySecret().empty(); }
bool        PaymentService::stripeConfigured()   { return !stripeKey().empty(); }

// ── Helpers ───────────────────────────────────────────────────────────────────
std::string PaymentService::generateOrderId() {
    static std::mt19937_64 rng{std::random_device{}()};
    std::uniform_int_distribution<uint64_t> dist;
    std::ostringstream ss;
    ss << "ORD-" << std::hex << std::uppercase << dist(rng);
    return ss.str().substr(0, 20);
}

std::string PaymentService::hmacSHA256(const std::string& key, const std::string& data) {
    unsigned char digest[EVP_MAX_MD_SIZE];
    unsigned int  len = 0;
    HMAC(EVP_sha256(), key.c_str(), (int)key.size(),
         reinterpret_cast<const unsigned char*>(data.c_str()), data.size(), digest, &len);
    std::ostringstream ss;
    for (unsigned int i = 0; i < len; i++) ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
    return ss.str();
}

static bool constEq(const std::string& a, const std::string& b) {
    return a.size() == b.size() && CRYPTO_memcmp(a.data(), b.data(), a.size()) == 0;
}

// ── Create Order ──────────────────────────────────────────────────────────────
PaymentOrder PaymentService::createOrder(const std::string& tenantId, const std::string& invoiceId, double amount,
                                         const std::string& currency, PaymentGateway gateway) {
    PaymentOrder order;
    order.orderId   = generateOrderId();
    order.tenantId  = tenantId;
    order.invoiceId = invoiceId;
    order.amount    = amount;
    order.currency  = currency;
    order.gateway   = (gateway == PaymentGateway::RAZORPAY) ? "RAZORPAY" : "STRIPE";

    order = (gateway == PaymentGateway::RAZORPAY) ? createRazorpayOrder(order) : createStripeOrder(order);
    if (!order.error.empty()) return order;

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO payment_orders(id, tenant_id, invoice_id, amount, currency, status, gateway, gateway_ref, checkout_url) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO NOTHING",
            order.orderId, order.tenantId, order.invoiceId, order.amount, order.currency, order.status,
            order.gateway, order.gatewayRef, order.checkoutUrl);
        txn.commit();
    } catch (const std::exception& e) {
        core::Logger::error("[Payment] DB error: " + std::string(e.what()));
        order.error = "Could not store the order"; order.httpStatus = 500;
        return order;
    }
    core::Logger::info("[Payment] Order created: " + order.orderId + " gateway=" + order.gateway);
    return order;
}

// Real Razorpay Orders API: POST /v1/orders (Basic auth key_id:key_secret), amount in paise.
PaymentOrder PaymentService::createRazorpayOrder(const PaymentOrder& base) {
    PaymentOrder order = base;
    if (!razorpayConfigured()) { order.error = "Payment gateway not configured"; order.httpStatus = 503; return order; }
    Json::Value body;
    body["amount"] = static_cast<Json::Int64>(std::llround(order.amount * 100.0));
    body["currency"] = order.currency;
    body["receipt"] = order.orderId;
    Json::Value notes; notes["invoice_id"] = order.invoiceId; body["notes"] = notes;
    Json::StreamWriterBuilder w; w["indentation"] = "";
    auto r = httpout::post(env("RAZORPAY_API_BASE", "https://api.razorpay.com"), "/v1/orders", "application/json",
                           Json::writeString(w, body),
                           {{"Authorization", "Basic " + httpout::base64(razorpayKeyId() + ":" + razorpaySecret())}});
    if (!r.ok) { order.error = "Payment gateway unreachable"; order.httpStatus = 502; return order; }
    Json::Value j; Json::CharReaderBuilder rb; std::string err; std::unique_ptr<Json::CharReader> rd(rb.newCharReader());
    if (r.status < 200 || r.status >= 300 || !rd->parse(r.body.data(), r.body.data() + r.body.size(), &j, &err) || !j.isMember("id")) {
        core::Logger::warn("[Payment] Razorpay rejected order, status " + std::to_string(r.status));
        order.error = "Payment gateway rejected the request"; order.httpStatus = 502; return order;
    }
    order.gatewayRef = j["id"].asString();
    order.keyId = razorpayKeyId();
    order.status = "CREATED";
    return order;
}

// Real Stripe PaymentIntents API: POST /v1/payment_intents (Bearer secret key, form-encoded, smallest currency unit).
PaymentOrder PaymentService::createStripeOrder(const PaymentOrder& base) {
    PaymentOrder order = base;
    if (!stripeConfigured()) { order.error = "Payment gateway not configured"; order.httpStatus = 503; return order; }
    std::string cur = order.currency; for (auto& c : cur) c = static_cast<char>(std::tolower(c));
    const std::string form = "amount=" + std::to_string(std::llround(order.amount * 100.0)) + "&currency=" + httpout::urlEncode(cur) +
                             "&metadata[order_id]=" + httpout::urlEncode(order.orderId) + "&metadata[invoice_id]=" + httpout::urlEncode(order.invoiceId) +
                             "&automatic_payment_methods[enabled]=true";
    auto r = httpout::post(env("STRIPE_API_BASE", "https://api.stripe.com"), "/v1/payment_intents", "application/x-www-form-urlencoded", form,
                           {{"Authorization", "Bearer " + stripeKey()}, {"Idempotency-Key", order.orderId}});
    if (!r.ok) { order.error = "Payment gateway unreachable"; order.httpStatus = 502; return order; }
    Json::Value j; Json::CharReaderBuilder rb; std::string err; std::unique_ptr<Json::CharReader> rd(rb.newCharReader());
    if (r.status < 200 || r.status >= 300 || !rd->parse(r.body.data(), r.body.data() + r.body.size(), &j, &err) || !j.isMember("id")) {
        core::Logger::warn("[Payment] Stripe rejected order, status " + std::to_string(r.status));
        order.error = "Payment gateway rejected the request"; order.httpStatus = 502; return order;
    }
    order.gatewayRef = j["id"].asString();
    order.clientSecret = j.get("client_secret", "").asString();
    order.status = "CREATED";
    return order;
}

// ── Webhook verification ──────────────────────────────────────────────────────
PaymentResult PaymentService::verifyWebhook(const std::string& payload, const std::string& signature, PaymentGateway gateway) {
    PaymentResult result;
    const bool valid = (gateway == PaymentGateway::RAZORPAY) ? verifyRazorpaySignature(payload, signature) : verifyStripeSignature(payload, signature);
    if (!valid) { result.error = "Invalid webhook signature"; core::Logger::warn("[Payment] Invalid webhook signature"); return result; }

    Json::Value j; Json::CharReaderBuilder rb; std::string err; std::unique_ptr<Json::CharReader> rd(rb.newCharReader());
    if (!rd->parse(payload.data(), payload.data() + payload.size(), &j, &err) || !j.isObject()) { result.error = "Invalid payload"; return result; }
    result.success = true;
    if (gateway == PaymentGateway::RAZORPAY) {
        const std::string ev = j.get("event", "").asString();
        const auto& ent = j["payload"]["payment"]["entity"];
        result.paid = (ev == "payment.captured" || ev == "order.paid");
        result.gatewayPaymentId = ent.get("id", "").asString();
        result.gatewayRef = ent.get("order_id", j["payload"]["order"]["entity"].get("id", "").asString()).asString();
    } else {
        const std::string ev = j.get("type", "").asString();
        const auto& obj = j["data"]["object"];
        result.paid = (ev == "payment_intent.succeeded");
        result.gatewayPaymentId = obj.get("latest_charge", obj.get("id", "").asString()).asString();
        result.gatewayRef = obj.get("id", "").asString();
    }
    result.status = result.paid ? "PAID" : "IGNORED";
    if (result.paid && !result.gatewayRef.empty()) markPaidByGatewayRef(result.gatewayRef);
    return result;
}

// Razorpay webhook: hex HMAC-SHA256 of the raw body with the webhook secret. Rejected when no secret is configured.
bool PaymentService::verifyRazorpaySignature(const std::string& payload, const std::string& signature) {
    const std::string secret = razorpayWebhook();
    if (secret.empty() || signature.empty()) return false;
    return constEq(hmacSHA256(secret, payload), signature);
}

// Stripe webhook: header "t=<unix>,v1=<hex>"; v1 = HMAC-SHA256(secret, t + "." + payload); 5 minute tolerance.
bool PaymentService::verifyStripeSignature(const std::string& payload, const std::string& header) {
    const std::string secret = env("STRIPE_WEBHOOK_SECRET");
    if (secret.empty() || header.empty()) return false;
    std::string t; std::vector<std::string> v1; size_t s = 0;
    while (s <= header.size()) {
        size_t e = header.find(',', s); if (e == std::string::npos) e = header.size();
        std::string part = header.substr(s, e - s); auto eq = part.find('=');
        if (eq != std::string::npos) { auto k = part.substr(0, eq), v = part.substr(eq + 1); if (k == "t") t = v; else if (k == "v1") v1.push_back(v); }
        s = e + 1;
    }
    if (t.empty() || v1.empty()) return false;
    long long ts = 0; try { ts = std::stoll(t); } catch (...) { return false; }
    if (std::llabs(static_cast<long long>(std::time(nullptr)) - ts) > 300) return false;
    const std::string expected = hmacSHA256(secret, t + "." + payload);
    for (const auto& v : v1) if (constEq(expected, v)) return true;
    return false;
}

// ── Order status (tenant scoped) ──────────────────────────────────────────────
Json::Value PaymentService::getOrderStatus(const std::string& orderId, const std::string& tenantId) {
    Json::Value result;
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT id, invoice_id, amount, currency, status, gateway, gateway_ref FROM payment_orders WHERE id=$1 AND tenant_id=$2", orderId, tenantId);
        if (!r.empty()) {
            result["order_id"]    = r[0][0].c_str();
            result["invoice_id"]  = r[0][1].c_str();
            result["amount"]      = r[0][2].as<double>();
            result["currency"]    = r[0][3].c_str();
            result["status"]      = r[0][4].c_str();
            result["gateway"]     = r[0][5].c_str();
            result["gateway_ref"] = r[0][6].c_str();
        } else {
            result["error"] = "Order not found";
        }
    } catch (const std::exception&) { result["error"] = "Internal server error"; }
    return result;
}

bool PaymentService::markPaidByGatewayRef(const std::string& gatewayRef) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params("UPDATE payment_orders SET status='PAID', paid_at=NOW() WHERE gateway_ref=$1 AND status<>'PAID'", gatewayRef);
        txn.commit();
        core::Logger::info("[Payment] Marked PAID: " + gatewayRef);
        return true;
    } catch (const std::exception& e) {
        core::Logger::error("[Payment] markPaid error: " + std::string(e.what()));
        return false;
    }
}
