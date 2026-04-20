#pragma once
#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>
#include <sstream>

class Logger {
public:
    static void info(const std::string& message) {
        emit("INFO", message, std::cout);
    }

    static void error(const std::string& message) {
        emit("ERROR", message, std::cerr);
    }

private:
    static void emit(const std::string& level, const std::string& message, std::ostream& out) {
        // 1. Generate ISO 8601 Timestamp
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);
        
        std::stringstream ss;
        ss << std::put_time(std::localtime(&in_time_t), "%Y-%m-%dT%H:%M:%S");

        // 2. Output Structured JSON
        // Using raw strings (R"(...)") makes the JSON much easier to read in C++
        out << "{"
            << "\"ts\":\"" << ss.str() << "\","
            << "\"lvl\":\"" << level << "\","
            << "\"msg\":\"" << message << "\""
            << "}" << std::endl;
    }
};