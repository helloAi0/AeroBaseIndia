#include "MLDatasetExporter.h"
#include "../core/Logger.h" // Your JSON structured logger
#include <drogon/drogon.h>
#include <fstream>

using namespace drogon::orm;

bool MLDatasetExporter::exportTrainingData(const std::string& filepath) {
    // 1. Get the global PostgreSQL database client
    auto client = drogon::app().getDbClient();
    
    if (!client) {
        Logger::error("Database client is not available for ML export.");
        return false;
    }

    // 2. Open the file stream safely
    std::ofstream file(filepath);
    if (!file.is_open()) {
        Logger::error("Failed to open file for ML export: " + filepath);
        return false;
    }

    // 3. Write CSV Header (Features + Target Variable)
    file << "flight_id,weather_condition,terminal_congestion,delay_minutes\n";

    try {
        // 4. Query the database (Fetching historical completed flights)
        // Note: Using Sync execution here is acceptable if this is run 
        // as a background cron job or startup script, rather than blocking an API request.
        auto result = client->execSqlSync(
            "SELECT id, weather_condition, terminal_congestion_level, delay_minutes "
            "FROM flight_history "
            "WHERE status = 'completed' "
            "ORDER BY created_at DESC "
            "LIMIT 10000;"
        );

        // 5. Stream rows into the CSV
        for (const auto& row : result) {
            file << row["id"].as<std::string>() << ","
                 << row["weather_condition"].as<std::string>() << ","
                 << row["terminal_congestion_level"].as<int>() << ","
                 << row["delay_minutes"].as<int>() << "\n";
        }

        // 6. Log success
        Logger::info("Successfully exported " + std::to_string(result.size()) + " rows to " + filepath);
        return true;

    } catch (const DrogonDbException &e) {
        // Catch any SQL syntax errors or connection drops
        Logger::error("DB Error during ML export: " + std::string(e.base().what()));
        return false;
    }
}