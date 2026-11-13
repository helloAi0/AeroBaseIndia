#pragma once
#include <string>
#include <vector>
#include <json/json.h>

enum class PaymentGateway { RAZORPAY, STRIPE };

struct PaymentOrder {
    std::string orderId;
    std::string tenantId;
    std::string invoiceId;
    double      amount      = 0.0;
    std::string currency    = "INR";
    std::string status      = "CREATED";
    std::string gatewayRef;
    std::string checkoutUrl;
    std::string gateway;
    std::string keyId;          // public Razorpay key id for Checkout.js (never the secret)
    std::string clientSecret;   // Stripe PaymentIntent client_secret
    std::string error;          // non-empty => the order was NOT created
    int         httpStatus = 200;
};

struct PaymentResult {
    bool        success = false;
    std::string orderId;
    std::string gatewayPaymentId;
    std::string gatewayRef;     // order / payment-intent id the event refers to
    bool        paid = false;   // event means money was captured
    std::string status;
    std::string error;
};

class PaymentService {
public:
    // Create payment order (returns checkout URL)
    static PaymentOrder createOrder(const std::string& tenantId,
                                    const std::string& invoiceId,
                                    double             amount,
                                    const std::string& currency  = "INR",
                                    PaymentGateway     gateway   = PaymentGateway::RAZORPAY);

    // Verify webhook signature from Razorpay/Stripe
    static PaymentResult verifyWebhook(const std::string& payload,
                                        const std::string& signature,
                                        PaymentGateway     gateway);

    // Get order status from DB
    static Json::Value getOrderStatus(const std::string& orderId, const std::string& tenantId);

    // Mark the order whose gateway reference (Razorpay order id / Stripe PaymentIntent id) matches as paid.
    static bool markPaidByGatewayRef(const std::string& gatewayRef);

    // Which gateways are configured (no secrets)
    static std::string razorpayKeyId();
    static bool        razorpayConfigured();
    static bool        stripeConfigured();

private:
    // Razorpay
    static PaymentOrder createRazorpayOrder(const PaymentOrder& order);
    static bool         verifyRazorpaySignature(const std::string& payload,
                                                 const std::string& signature);

    // Stripe
    static PaymentOrder createStripeOrder(const PaymentOrder& order);
    static bool         verifyStripeSignature(const std::string& payload,
                                               const std::string& signature);

    static std::string  hmacSHA256(const std::string& key,
                                    const std::string& data);
    static std::string  generateOrderId();
};
