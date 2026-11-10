#include "EmailService.h"
#include "../core/Logger.h"
#include "../config/DatabaseManager.h"
#include <pqxx/pqxx>
#include <drogon/drogon.h>
#include <regex>
#include <cstdlib>
#include <mutex>
#include <chrono>
#include <sstream>

static std::vector<EmailPayload> emailQueue_;
static std::mutex                queueMutex_;

static std::string envs(const char* k, const char* d = "") { const char* v = std::getenv(k); return v ? v : d; }

// Real delivery through Brevo (free tier ~300/day). Needs BREVO_API_KEY and BREVO_SENDER_EMAIL
// (a sender verified in Brevo). Fire-and-forget; failures are logged without secrets.
static void deliverViaBrevo(const EmailPayload& p) {
    const std::string key = envs("BREVO_API_KEY"), sender = envs("BREVO_SENDER_EMAIL");
    if (key.empty() || sender.empty()) return;
    static const std::regex re(R"(^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$)");
    if (!std::regex_match(p.to, re)) { core::Logger::info("[Email] skipped: invalid recipient"); return; }
    std::string subject = p.subject;
    for (auto& c : subject) if (c == '\r' || c == '\n') c = ' ';

    Json::Value b;
    b["sender"]["email"] = sender;
    b["sender"]["name"]  = envs("BREVO_SENDER_NAME", "AeroBase India");
    b["to"][0]["email"]  = p.to;
    b["subject"]         = subject;
    b["textContent"]     = p.body;

    auto client = drogon::HttpClient::newHttpClient(envs("BREVO_API_BASE", "https://api.brevo.com"));
    auto req = drogon::HttpRequest::newHttpJsonRequest(b);
    req->setMethod(drogon::Post);
    req->setPath("/v3/smtp/email");
    req->addHeader("api-key", key);
    req->addHeader("accept", "application/json");
    client->sendRequest(req, [](drogon::ReqResult r, const drogon::HttpResponsePtr& resp) {
        if (r != drogon::ReqResult::Ok || !resp) core::Logger::info("[Email] Brevo unreachable");
        else if (resp->statusCode() >= 300) core::Logger::info("[Email] Brevo error " + std::to_string(resp->statusCode()));
    }, 10.0);
}

bool EmailService::send(const EmailPayload& payload) {
    // In production: integrate SMTP/SendGrid/AWS SES here
    // For now: log + persist to DB queue + in-memory queue

    core::Logger::info("[Email] TO=" + payload.to +
                       " TYPE=" + payload.type +
                       " SUBJECT=" + payload.subject);

    // Store in memory queue
    {
        std::lock_guard<std::mutex> lock(queueMutex_);
        emailQueue_.push_back(payload);
        if (emailQueue_.size() > 1000)
            emailQueue_.erase(emailQueue_.begin());
    }

    // Persist to DB for audit trail
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO email_logs(tenant_id, recipient, subject, "
            "body, type, sent_at) "
            "VALUES($1,$2,$3,$4,$5,NOW()) "
            "ON CONFLICT DO NOTHING",
            payload.tenantId, payload.to,
            payload.subject,  payload.body,
            payload.type);
        txn.commit();
    } catch (...) {
        // DB logging failure doesn't block email
    }

    deliverViaBrevo(payload);
    return true;
}

std::string EmailService::renderTemplate(
    const std::string& type,
    const std::unordered_map<std::string, std::string>& vars)
{
    // Simple template engine — replace {{KEY}} with value
    static std::unordered_map<std::string, std::string> templates = {
        {"WELCOME",
         "Welcome to AeroBase, {{name}}!\n\n"
         "Your airport portal is ready.\n"
         "Airport: {{tenantId}}\n\n"
         "Best regards,\nAeroBase India Team"},

        {"BOOKING",
         "Booking Confirmed!\n\n"
         "Flight:       {{flightNumber}}\n"
         "From:         {{departure}}\n"
         "To:           {{destination}}\n"
         "Status:       Confirmed\n\n"
         "Thank you for flying with us.\nAeroBase India"},

        {"DELAY",
         "Flight Delay Notice\n\n"
         "Your flight {{flightNumber}} has been delayed.\n"
         "Expected delay: {{delayMins}} minutes\n\n"
         "We apologize for the inconvenience.\nAeroBase India"},

        {"BILLING",
         "Invoice Ready\n\n"
         "Invoice ID:   {{invoiceId}}\n"
         "Amount Due:   INR {{amount}}\n"
         "Due Date:     30 days from today\n\n"
         "Please login to your billing portal to pay.\n"
         "AeroBase India"},

        {"SECURITY",
         "Security Alert\n\n"
         "A security event was detected on your account:\n"
         "Event: {{event}}\n"
         "Time:  {{timestamp}}\n\n"
         "If this was not you, contact support immediately.\n"
         "AeroBase India"},
    };

    std::string tmpl = templates.count(type)
        ? templates.at(type)
        : "AeroBase Notification: " + type;

    for (auto& [k, v] : vars) {
        std::string placeholder = "{{" + k + "}}";
        size_t pos = 0;
        while ((pos = tmpl.find(placeholder, pos)) != std::string::npos) {
            tmpl.replace(pos, placeholder.size(), v);
            pos += v.size();
        }
    }
    return tmpl;
}

void EmailService::sendWelcome(const std::string& to,
                                const std::string& name,
                                const std::string& tenantId) {
    EmailPayload p;
    p.to       = to;
    p.subject  = "Welcome to AeroBase India!";
    p.type     = "WELCOME";
    p.tenantId = tenantId;
    p.body     = renderTemplate("WELCOME", {{"name", name},
                                             {"tenantId", tenantId}});
    send(p);
}

void EmailService::sendBookingConfirmation(const std::string& to,
                                            const std::string& flightNumber,
                                            const std::string& departure,
                                            const std::string& destination,
                                            const std::string& tenantId) {
    EmailPayload p;
    p.to       = to;
    p.subject  = "Booking Confirmed — Flight " + flightNumber;
    p.type     = "BOOKING";
    p.tenantId = tenantId;
    p.body     = renderTemplate("BOOKING", {
        {"flightNumber", flightNumber},
        {"departure",    departure},
        {"destination",  destination}});
    send(p);
}

void EmailService::sendDelayAlert(const std::string& to,
                                   const std::string& flightNumber,
                                   int                delayMins,
                                   const std::string& tenantId) {
    EmailPayload p;
    p.to       = to;
    p.subject  = "Delay Alert — Flight " + flightNumber;
    p.type     = "DELAY";
    p.tenantId = tenantId;
    p.body     = renderTemplate("DELAY", {
        {"flightNumber", flightNumber},
        {"delayMins",    std::to_string(delayMins)}});
    send(p);
}

void EmailService::sendBillingInvoice(const std::string& to,
                                       const std::string& invoiceId,
                                       double             amount,
                                       const std::string& tenantId) {
    EmailPayload p;
    p.to       = to;
    p.subject  = "Invoice " + invoiceId + " from AeroBase India";
    p.type     = "BILLING";
    p.tenantId = tenantId;
    std::ostringstream amt;
    amt << std::fixed;
    amt.precision(2);
    amt << amount;
    p.body = renderTemplate("BILLING", {
        {"invoiceId", invoiceId},
        {"amount",    amt.str()}});
    send(p);
}

void EmailService::sendSecurityAlert(const std::string& to,
                                      const std::string& event,
                                      const std::string& tenantId) {
    EmailPayload p;
    p.to       = to;
    p.subject  = "[SECURITY ALERT] AeroBase India";
    p.type     = "SECURITY";
    p.tenantId = tenantId;
    auto now   = std::to_string(std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()).count());
    p.body = renderTemplate("SECURITY", {{"event", event}, {"timestamp", now}});
    send(p);
}

std::vector<EmailPayload> EmailService::getQueue() {
    std::lock_guard<std::mutex> lock(queueMutex_);
    return emailQueue_;
}

void EmailService::clearQueue() {
    std::lock_guard<std::mutex> lock(queueMutex_);
    emailQueue_.clear();
}
