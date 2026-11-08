#pragma once
#include <string>
#include <json/json.h>

class BillingCalculator {
public:
    static Json::Value generateDraftInvoice(const std::string& tenantId, const std::string& monthYear);
};