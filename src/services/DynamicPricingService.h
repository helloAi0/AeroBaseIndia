#pragma once

class DynamicPricingService {
public:
    // Calculates the final price for an airline to book a slot
    static double calculateSlotPrice(double basePrice, int currentFlights, int maxCapacity);
};