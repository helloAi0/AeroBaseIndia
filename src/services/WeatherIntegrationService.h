#pragma once
#include "DigitalTwinService.hpp"
#include <string>

class WeatherIntegrationService {
private:
    DigitalTwinService& twinService;

public:
    WeatherIntegrationService(DigitalTwinService& ts) : twinService(ts) {}

    // Polls external API and updates the Twin
    void syncCurrentWeather(const std::string& airportCode);
};