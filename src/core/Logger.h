#pragma once
#include <iostream>
#include <chrono>
#include <ctime>

class Logger {
public:
    static void info(const std::string& message) {
        log("INFO", message);
    }

    static void error(const std::string& message) {
        log("ERROR", message);
    }

private:
    static void log(const std::string& level,
                    const std::string& message) {
        auto now = std::chrono::system_clock::to_time_t(
            std::chrono::system_clock::now()
        );

        std::cout
            << "[" << level << "] "
            << std::ctime(&now)
            << " - " << message
            << std::endl;
    }
};