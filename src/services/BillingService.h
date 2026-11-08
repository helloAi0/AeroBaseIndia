#pragma once

#include "../repositories/BillingRepository.h"
#include "../models/Invoice.h"
#include "AuthService.h"
#include <string>

class BillingService {
public:
    static Invoice generateInvoice(
        const std::string& tenantId,
        const std::string& subscriptionId,
        double amount
    ) {
        Invoice invoice;
        invoice.id = AuthService::generateUUID();
        invoice.tenantId = tenantId;
        invoice.subscriptionId = subscriptionId;
        invoice.amount = amount;
        invoice.currency = "INR";
        invoice.status = "PENDING";
        invoice.dueAt = "2026-05-20 00:00:00";

        return invoice;
    }
};