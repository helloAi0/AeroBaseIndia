#pragma once
#include "../repositories/BillingRepository.h"
#include "../models/Invoice.h"
#include "AuthService.h"
#include <string>

class BillingService {
public:
    /**
     * Orchestrates the creation and persistence of an invoice.
     * Use this when a subscription renews or a one-time fee is charged.
     */
    static void generateAndSaveInvoice(const std::string& tenantId, 
                                       const std::string& subscriptionId, 
                                       double amount) {
        
        // 1. Logic: Build the Invoice Model
        Invoice invoice;
        invoice.id = AuthService::generateUUID();
        invoice.tenantId = tenantId;
        invoice.subscriptionId = subscriptionId;
        invoice.amount = amount;
        invoice.currency = "INR";
        invoice.status = "PENDING";
        
        // Setting a due date for 30 days from now (April 20, 2026 -> May 20, 2026)
        invoice.dueAt = "2026-05-20 00:00:00"; 

        // 2. Persistence: Save to the database via the Repository
        BillingRepository::save(invoice);
    }
};