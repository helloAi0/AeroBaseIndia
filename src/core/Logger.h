#pragma once

#include <iostream>
#include <string>
#include <chrono>
#include <iomanip>
#include <sstream>

namespace core {

class Logger {
public:
    static void info(const std::string& message) {
        emit("INFO", message, std::cout);
    }

    static void warn(const std::string& message) {
        emit("WARN", message, std::cerr);
    }

    static void error(const std::string& message) {
        emit("ERROR", message, std::cerr);
    }

    static void critical(const std::string& message) {
        emit("CRIT", message, std::cerr);
    }

private:
    static void emit(const std::string& level, const std::string& message, std::ostream& out) {
        // ISO 8601 timestamp
        auto now = std::chrono::system_clock::now();
        auto in_time_t = std::chrono::system_clock::to_time_t(now);

        std::stringstream ts;
        ts << std::put_time(std::localtime(&in_time_t), "%Y-%m-%dT%H:%M:%S");

        out << "{"
            << "\"ts\":\"" << ts.str() << "\","
            << "\"lvl\":\"" << level << "\","
            << "\"msg\":\"" << escapeJson(message) << "\""
            << "}" << std::endl;
    }

    // Minimal JSON string escaper for log messages
    static std::string escapeJson(const std::string& s) {
        std::string out;
        out.reserve(s.size());
        for (char c : s) {
            switch (c) {
                case '\"': out += "\\\""; break;
                case '\\': out += "\\\\"; break;
                case '\b': out += "\\b";  break;
                case '\f': out += "\\f";  break;
                case '\n': out += "\\n";  break;
                case '\r': out += "\\r";  break;
                case '\t': out += "\\t";  break;
                default:
                    if (static_cast<unsigned char>(c) < 0x20) {
                        std::ostringstream oss;
                        oss << "\\u" << std::hex << std::setw(4) << std::setfill('0')
                            << static_cast<int>(static_cast<unsigned char>(c));
                        out += oss.str();
                    } else {
                        out += c;
                    }
            }
        }
        return out;
    }
};

} // namespace core

// Backwards-compatibility: allow both Logger::warn() and core::Logger::warn()
using Logger = core::Logger;
