#pragma once
#include <pqxx/pqxx>
#include <memory>
#include "AppConfig.h" // Required to fetch environment variables

class DatabaseManager {
public:
    static std::shared_ptr<pqxx::connection> getConnection() {
        // Initialize once using a Lambda to keep the logic clean
        static auto conn = []() {
            // Build the connection string dynamically from the environment
            std::string connStr =
                "dbname=" + AppConfig::getEnv("DB_NAME", "aerobase") +
                " user=" + AppConfig::getEnv("DB_USER", "postgres") +
                " password=" + AppConfig::getEnv("DB_PASSWORD", "password") +
                " host=" + AppConfig::getEnv("DB_HOST", "localhost") +
                " port=" + AppConfig::getEnv("DB_PORT", "5432");

            return std::make_shared<pqxx::connection>(connStr);
        }();

        return conn;
    }
};