#include "OverageService.h"
#include <algorithm>

double OverageService::calculateOverageFees(const std::string& tenantId, const std::string& monthYear) {
    double totalOverage = 0.0;

    // Mocked Plan Limits (Normally fetched from DB: SELECT api_limit FROM tenant_subscriptions)
    long includedApiCalls = 100000;
    double apiOverageRate = 0.0015; // $0.0015 per extra call

    long includedPredictions = 5000;
    double predictionOverageRate = 0.05; // $0.05 per extra AI prediction

    // Mocked Usage (Normally fetched from Redis: GET usage:tenant_id:api_calls:2026-04)
    long actualApiCalls = 125000;
    long actualPredictions = 5200;

    // MAANG Logic: Calculate overages only if they exceed limits
    if (actualApiCalls > includedApiCalls) {
        totalOverage += (actualApiCalls - includedApiCalls) * apiOverageRate;
    }

    if (actualPredictions > includedPredictions) {
        totalOverage += (actualPredictions - includedPredictions) * predictionOverageRate;
    }

    return totalOverage;
}