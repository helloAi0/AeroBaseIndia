#pragma once
#include <drogon/drogon.h>
#include "../core/Logger.h"
#include <chrono>

using namespace drogon;

class RequestTimer {
public:
    static void logRequest(const std::string& path,
                           std::chrono::steady_clock::time_point start) {
        auto end = std::chrono::steady_clock::now();

        auto ms = std::chrono::duration_cast<
            std::chrono::milliseconds>(end - start).count();

        Logger::info("Request " + path + " took " + std::to_string(ms) + " ms");
    }
};