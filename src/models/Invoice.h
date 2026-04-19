#pragma once
#include <string>

struct Invoice {
    std::string id;
    std::string tenantId;
    std::string subscriptionId;
    double amount;
    std::string currency;
    std::string status;
    std::string dueAt;
};
