#include "WeatherIntegrationService.h"
#include "../realtime/TwinWebSocket.h"  // fixed relative path
#include "../core/Logger.h"
#include <string>

void WeatherIntegrationService::syncCurrentWeather(const std::string& airportCode) {
    Logger::info("Fetching METAR data for " + airportCode);

    // MOCK API CALL: In reality, you'd use Drogon's HttpClient here
    std::string newStatus = "STORM_WARNING";
    float newVis = 2.5f;
    float newWind = 65.0f;

    // 1. Update the thread-safe Digital Twin
    auto state = twinService.getState(); // Get copy
    // We need a setter in TwinService for this in reality, or do it securely:
    twinService.updateWeather(newStatus, newVis, newWind); 

    // 2. Broadcast to Frontend instantly
    std::string updateJson = 
        "{\"type\":\"WEATHER_UPDATE\","
        "\"status\":\"" + newStatus + "\","
        "\"visibility\":" + std::to_string(newVis) + ","
        "\"wind_speed\":" + std::to_string(newWind) + "}";
        
    TwinWebSocket::broadcastUpdate(updateJson);
    
    Logger::warn("Weather downgraded to: " + newStatus);
}
