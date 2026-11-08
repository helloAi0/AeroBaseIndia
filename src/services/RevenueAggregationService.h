#pragma once
#include <string>
#include <drogon/drogon.h>

class RevenueAggregationService {
public:
    // Fetches daily revenue, hitting Redis first, then PostgreSQL if needed
    static double getDailyRevenue(const std::string& tenantId);
    
    // Call this whenever a new payment is processed to update the cache
    static void incrementDailyRevenue(const std::string& tenantId, double amount);
};