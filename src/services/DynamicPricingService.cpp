#include "DynamicPricingService.h"
#include <algorithm> // for std::max

double DynamicPricingService::calculateSlotPrice(double basePrice, int currentFlights, int maxCapacity) {
    // 1. Calculate Occupancy Ratio
    double occupancyRatio = static_cast<double>(currentFlights) / static_cast<double>(maxCapacity);
    
    // 2. Determine Demand Multiplier
    double demandMultiplier = 1.0;

    if (occupancyRatio > 0.90) {
        demandMultiplier = 2.5;  // Severe Congestion (Surge)
    } else if (occupancyRatio > 0.75) {
        demandMultiplier = 1.5;  // High Demand
    } else if (occupancyRatio < 0.20) {
        demandMultiplier = 0.8;  // Low Demand (Discount to attract traffic)
    }

    // 3. Calculate Final Price
    double finalPrice = basePrice * demandMultiplier;

    // 4. MAANG Logic: Safety Floor
    // Never allow pricing bugs to accidentally make slots free or pay the airline
    double minimumFloorPrice = basePrice * 0.5;
    
    return std::max(finalPrice, minimumFloorPrice);
}