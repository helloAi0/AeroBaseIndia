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

    // Detailed variant: ok=false when the ML service is unreachable or replied badly
    // (so callers can report an error instead of a fake "0 minutes").
    static void predictDelayDetailed(
        double weather,
        double congestion,
        std::function<void(bool ok, int delayMins, const std::string& model)>&& callback);

private:
    // Static accessor for ML service URL (no public constructor; no instance required)
    static std::string& mlServiceUrl();
};
