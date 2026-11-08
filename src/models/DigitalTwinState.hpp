#pragma once
#include <string>
#include <vector>
#include <ctime> // Required for std::time_t

struct GateState {
    std::string gateCode;
    std::string flightNumber;
    std::string status;
};

struct BaggageBeltState {
    std::string beltCode;
    std::string status;
};

struct PassengerZoneState {
    std::string zone;
    int peopleCount;
};

/**
 * Represents the comprehensive state of the airport at a specific point in time.
 * Includes physical infrastructure status and environmental conditions.
 */
struct DigitalTwinState {
    // Physical Assets
    std::vector<GateState> gates;
    std::vector<BaggageBeltState> belts;
    std::vector<PassengerZoneState> zones;

    // --- Weather Overlay (Added for Delay Prediction & Safety) ---
    std::string weatherStatus = "CLEAR"; 
    float visibilityKm = 10.0f;
    float windSpeedKmh = 15.0f;
    
    // Tracking Metadata
    std::time_t lastUpdated;
};