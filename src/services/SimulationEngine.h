#pragma once
#include <string>
#include <vector>
#include <unordered_set>

struct CascadeReport {
    int                      totalSystemDelayAdded = 0;
    std::vector<std::string> recommendedGateChanges;
    std::vector<std::string> impactedFlights;
    std::string              triggerId;
    std::string              impact        = "LOW";
    int                      affectedGates = 0;
};

class SimulationEngine {
public:
    static CascadeReport predictCascadingFailures(
        const std::string& rootFlightId,
        int                initialDelayMins);

private:
    static void simulateImpact(
        const std::string&              flightId,
        int                             delayMins,
        int                             depth,
        std::unordered_set<std::string>& visited,
        CascadeReport&                  report);

    static const int MAX_CASCADE_DEPTH = 3;
};
