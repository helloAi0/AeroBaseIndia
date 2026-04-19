#pragma once
#include "../repositories/BillingRepository.h"
#include "AuthService.h"

class BillingService {
public:
    static Invoice generateInvoice(const std::string& tenantId,
                                   const std::string& subscriptionId,
                                   double amount) {
        Invoice invoice;
        invoice.id = AuthService::generateUUID();
        invoice.tenantId = tenantId;
        invoice.subscriptionId = subscriptionId;
        invoice.amount = amount;
        invoice.currency = "INR";
        invoice.status = "PENDING";
        invoice.dueAt = "2026-01-01 00:00:00";
        return invoice;
    }
};