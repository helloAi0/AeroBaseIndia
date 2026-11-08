#pragma once

#include <string>
#include <chrono>

namespace core { class Logger; }

class RequestTimer {
public:
    static void logRequest(
        const std::string& path,
        std::chrono::steady_clock::time_point start);
};
