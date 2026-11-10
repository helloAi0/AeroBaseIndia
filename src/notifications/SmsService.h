#pragma once
#include <functional>
#include <string>
#include <vector>

struct SmsResult {
    std::string to;
    bool ok = false;
    std::string error;   // safe to show to the operator; never contains credentials
    std::string sid;     // provider message id
};

/**
 * Provider-agnostic SMS sender. Configuration is read from the environment ONLY
 * (never commit credentials):
 *   SMS_PROVIDER            twilio | log        (default: log = dry run, nothing is sent)
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 *   TWILIO_MESSAGING_SERVICE_SID  or  TWILIO_FROM  (E.164 number / sender)
 *   TWILIO_API_BASE         override for tests (default https://api.twilio.com)
 * Adding another provider (e.g. an India DLT-registered gateway) means adding one branch in send().
 */
class SmsService {
public:
    static std::string providerName();
    static bool isValidE164(const std::string& n);
    static std::string mask(const std::string& n);   // +91*****1234
    static void send(const std::string& to, const std::string& body,
                     std::function<void(SmsResult)>&& done);
};
