#pragma once
#include <string>
#include <map>
#include <json/json.h>

struct DigitalTwinState {
    std::string tenantId;
    int         activeFlights    = 0;
    int         totalPassengers  = 0;
    double      congestionLevel  = 0.0;
    std::string weatherStatus    = "Clear";
    int         gateOccupancy    = 0;
    std::string gateStatus       = "Normal";
    float       visibilityKm     = 10.0f;
    float       windSpeedKmh     = 0.0f;
    std::map<std::string, std::string> gates;
    std::map<std::string, std::string> zones;
};

class DigitalTwinService {
public:
    // getState with NO args (legacy callers) and WITH tenantId
    static DigitalTwinState getState();
    static DigitalTwinState getState(const std::string& tenantId);
    static Json::Value      toJson(const DigitalTwinState& state);
    static void             updateGate(const std::string& gate,
                                       const std::string& flight,
                                       const std::string& status);
    static void             updateWeather(const std::string& tenantId,
                                          const std::string& weather);
    static void             updateWeather(const std::string& tenantId,
                                          float visibilityKm,
                                          float windSpeedKmh);
    static void             updateState(const std::string& tenantId,
                                        const Json::Value& event);
};
