#include "BillingCalculator.h"
#include "OverageService.h"
#include "../config/DatabaseManager.h"
#include <cmath>

Json::Value BillingCalculator::generateDraftInvoice(const std::string& tenantId, const std::string& monthYear) {
    Json::Value invoice;

    // 1. Fetch Base Plan Cost
    double basePlanFee = 5000.00; // Mocked: e.g., "Enterprise Tier"

    // 2. Calculate Overages
    double overageFee = OverageService::calculateOverageFees(tenantId, monthYear);

    // 3. Subtotal
    double subtotal = basePlanFee + overageFee;

    // 4. Calculate Tax (e.g., 18% GST in India)
    double taxRate = 0.18;
    double taxAmount = subtotal * taxRate;

    // 5. MAANG Logic: Decimal-Safe Money Math
    // Round to exactly 2 decimal places to prevent float drift (e.g., 5000.000000001)
    double total = std::round((subtotal + taxAmount) * 100.0) / 100.0;

    invoice["tenant_id"] = tenantId;
    invoice["billing_period"] = monthYear;
    invoice["base_plan_fee"] = basePlanFee;
    invoice["overage_fee"] = std::round(overageFee * 100.0) / 100.0;
    invoice["subtotal"] = std::round(subtotal * 100.0) / 100.0;
    invoice["tax"] = std::round(taxAmount * 100.0) / 100.0;
    invoice["total"] = total;
    invoice["status"] = "DRAFT";

    // In production, insert this JSON payload into the `invoices` table here.

    return invoice;
}