#pragma once
#include <string>
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
};

struct PaymentResult {
    bool        success = false;
    std::string orderId;
    std::string gatewayPaymentId;
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
    static Json::Value getOrderStatus(const std::string& orderId);

    // Mark order paid (called after webhook verification)
    static bool markPaid(const std::string& orderId,
                         const std::string& gatewayPaymentId);

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
