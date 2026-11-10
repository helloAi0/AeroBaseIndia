#include "PaymentService.h"
#include "../config/DatabaseManager.h"
#include "../notifications/EmailService.h"
#include "../core/Logger.h"
#include <pqxx/pqxx>
#include <openssl/hmac.h>
#include <openssl/sha.h>
#include <sstream>
#include <iomanip>
#include <random>
#include <cstdlib>
#include <chrono>

// ── Config from environment ───────────────────────────────────────────────────
static std::string getEnv(const char* k, const std::string& fb) {
    const char* v = std::getenv(k);
    return v ? std::string(v) : fb;
}

static const std::string RAZORPAY_KEY_ID =
    getEnv("RAZORPAY_KEY_ID",    "rzp_test_DEMO_KEY");
static const std::string RAZORPAY_SECRET =
    getEnv("RAZORPAY_SECRET",    "razorpay_test_secret");
static const std::string STRIPE_SECRET_KEY =
    getEnv("STRIPE_SECRET_KEY",  "sk_test_DEMO_KEY");
static const std::string STRIPE_WEBHOOK_SECRET =
    getEnv("STRIPE_WEBHOOK_SECRET", "whsec_DEMO");

// ── Helpers ───────────────────────────────────────────────────────────────────
std::string PaymentService::generateOrderId() {
    static std::mt19937_64 rng{std::random_device{}()};
    std::uniform_int_distribution<uint64_t> dist;
    std::ostringstream ss;
    ss << "ORD-" << std::hex << std::uppercase << dist(rng);
    return ss.str().substr(0, 20);
}

std::string PaymentService::hmacSHA256(const std::string& key,
                                        const std::string& data) {
    unsigned char digest[EVP_MAX_MD_SIZE];
    unsigned int  len = 0;
    HMAC(EVP_sha256(),
         key.c_str(),  (int)key.size(),
         reinterpret_cast<const unsigned char*>(data.c_str()),
         data.size(), digest, &len);
    std::ostringstream ss;
    for (unsigned int i = 0; i < len; i++)
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
    return ss.str();
}

// ── Create Order ──────────────────────────────────────────────────────────────
PaymentOrder PaymentService::createOrder(const std::string& tenantId,
                                          const std::string& invoiceId,
                                          double             amount,
                                          const std::string& currency,
                                          PaymentGateway     gateway) {
    PaymentOrder order;
    order.orderId   = generateOrderId();
    order.tenantId  = tenantId;
    order.invoiceId = invoiceId;
    order.amount    = amount;
    order.currency  = currency;
    order.gateway   = (gateway == PaymentGateway::RAZORPAY) ? "RAZORPAY" : "STRIPE";

    // Simulate gateway API call
    // In production: make HTTP call to Razorpay/Stripe API
    if (gateway == PaymentGateway::RAZORPAY) {
        order = createRazorpayOrder(order);
    } else {
        order = createStripeOrder(order);
    }

    // Persist to DB
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO payment_orders(id, tenant_id, invoice_id, amount, "
            "currency, status, gateway, gateway_ref, checkout_url) "
            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) "
            "ON CONFLICT(id) DO NOTHING",
            order.orderId, order.tenantId, order.invoiceId,
            order.amount,  order.currency,  order.status,
            order.gateway, order.gatewayRef, order.checkoutUrl);
        txn.commit();
    } catch (const std::exception& e) {
        core::Logger::error("[Payment] DB error: " + std::string(e.what()));
    }

    core::Logger::info("[Payment] Order created: " + order.orderId +
                       " amount=" + std::to_string(order.amount) +
                       " gateway=" + order.gateway);
    return order;
}

PaymentOrder PaymentService::createRazorpayOrder(const PaymentOrder& base_order) {
    PaymentOrder order = base_order;
    // Razorpay order simulation
    // Production: POST https://api.razorpay.com/v1/orders
    // with Basic Auth: RAZORPAY_KEY_ID:RAZORPAY_SECRET
    order.gatewayRef  = "rzp_order_" + order.orderId;
    order.checkoutUrl = "https://api.razorpay.com/v1/checkout/embedded"
                        "?key=" + RAZORPAY_KEY_ID +
                        "&order_id=" + order.gatewayRef +
                        "&amount=" + std::to_string((long)(order.amount * 100)) +
                        "&currency=" + order.currency +
                        "&name=AeroBase+India"
                        "&description=Invoice+" + order.invoiceId;
    order.status = "CREATED";
    return order;
}

PaymentOrder PaymentService::createStripeOrder(const PaymentOrder& base_order) {
    PaymentOrder order = base_order;
    // Stripe Payment Intent simulation
    // Production: POST https://api.stripe.com/v1/payment_intents
    // with Bearer: STRIPE_SECRET_KEY
    order.gatewayRef  = "pi_" + order.orderId;
    order.checkoutUrl = "https://checkout.stripe.com/pay/"
                        + order.gatewayRef
                        + "?amount=" + std::to_string((long)(order.amount * 100))
                        + "&currency=" + order.currency;
    order.status = "CREATED";
    return order;
}

// ── Webhook Verification ──────────────────────────────────────────────────────
PaymentResult PaymentService::verifyWebhook(const std::string& payload,
                                             const std::string& signature,
                                             PaymentGateway     gateway) {
    PaymentResult result;
    bool valid = (gateway == PaymentGateway::RAZORPAY)
        ? verifyRazorpaySignature(payload, signature)
        : verifyStripeSignature(payload, signature);

    if (!valid) {
        result.success = false;
        result.error   = "Invalid webhook signature";
        core::Logger::warn("[Payment] Invalid webhook signature");
        return result;
    }

    // Parse payment ID from payload (simplified)
    result.success         = true;
    result.status          = "PAID";
    result.gatewayPaymentId = "pay_" + std::to_string(
        std::chrono::system_clock::now().time_since_epoch().count());

    core::Logger::info("[Payment] Webhook verified: " + result.gatewayPaymentId);
    return result;
}

bool PaymentService::verifyRazorpaySignature(const std::string& payload,
                                              const std::string& signature) {
    // Razorpay: HMAC-SHA256(orderId + "|" + paymentId, RAZORPAY_SECRET)
    std::string expected = hmacSHA256(RAZORPAY_SECRET, payload);
    return expected == signature;
}

bool PaymentService::verifyStripeSignature(const std::string& payload,
                                            const std::string& signature) {
    // Stripe: HMAC-SHA256(timestamp + "." + payload, STRIPE_WEBHOOK_SECRET)
    std::string expected = hmacSHA256(STRIPE_WEBHOOK_SECRET, payload);
    return expected == signature;
}

// ── Order Status ──────────────────────────────────────────────────────────────
Json::Value PaymentService::getOrderStatus(const std::string& orderId) {
    Json::Value result;
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params(
            "SELECT id, tenant_id, invoice_id, amount, currency, "
            "status, gateway, gateway_ref, checkout_url "
            "FROM payment_orders WHERE id=$1", orderId);
        if (!r.empty()) {
            result["order_id"]    = r[0][0].c_str();
            result["tenant_id"]   = r[0][1].c_str();
            result["invoice_id"]  = r[0][2].c_str();
            result["amount"]      = r[0][3].as<double>();
            result["currency"]    = r[0][4].c_str();
            result["status"]      = r[0][5].c_str();
            result["gateway"]     = r[0][6].c_str();
            result["gateway_ref"] = r[0][7].c_str();
            result["checkout_url"]= r[0][8].c_str();
        } else {
            result["error"] = "Order not found";
        }
    } catch (const std::exception& e) {
        result["error"] = "Internal server error";
    }
    return result;
}

bool PaymentService::markPaid(const std::string& orderId,
                               const std::string& gatewayPaymentId) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "UPDATE payment_orders SET status='PAID', "
            "gateway_ref=$2, paid_at=NOW() WHERE id=$1",
            orderId, gatewayPaymentId);
        txn.commit();
        core::Logger::info("[Payment] Marked PAID: " + orderId);
        return true;
    } catch (const std::exception& e) {
        core::Logger::error("[Payment] markPaid error: " + std::string(e.what()));
        return false;
    }
}
