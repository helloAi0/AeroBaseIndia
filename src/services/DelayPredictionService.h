#pragma once

#include <functional>
#include <string>

class DelayPredictionService {
public:
    // Called as: DelayPredictionService::predictDelay(...)
    // Signature must match the .cc usage (rvalue ref for callback).
    static void predictDelay(
        double weather,
        double congestion,
        std::function<void(int)>&& callback);

private:
    // Static accessor for ML service URL (no public constructor; no instance required)
    static std::string& mlServiceUrl();
};
