#pragma once
#include <string>
#include <vector>
#include <unordered_map>

struct EmailPayload {
    std::string to;
    std::string subject;
    std::string body;
    std::string tenantId;
    std::string type; // BOOKING | ALERT | BILLING | DELAY | WELCOME
};

class EmailService {
public:
    // Core send — queues email for delivery
    static bool send(const EmailPayload& payload);

    // Business event emails
    static void sendWelcome(const std::string& to,
                            const std::string& name,
                            const std::string& tenantId);

    static void sendBookingConfirmation(const std::string& to,
                                        const std::string& flightNumber,
                                        const std::string& departure,
                                        const std::string& destination,
                                        const std::string& tenantId);

    static void sendDelayAlert(const std::string& to,
                               const std::string& flightNumber,
                               int                delayMins,
                               const std::string& tenantId);

    static void sendBillingInvoice(const std::string& to,
                                   const std::string& invoiceId,
                                   double             amount,
                                   const std::string& tenantId);

    static void sendSecurityAlert(const std::string& to,
                                  const std::string& event,
                                  const std::string& tenantId);

    // Get queued emails (for admin portal)
    static std::vector<EmailPayload> getQueue();
    static void                      clearQueue();

private:
    static std::string renderTemplate(const std::string& type,
                                      const std::unordered_map<std::string,
                                      std::string>& vars);
};
