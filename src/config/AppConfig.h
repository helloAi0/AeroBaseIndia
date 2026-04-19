#pragma once
#include <cstdlib>
#include <string>

class AppConfig {
public:
    static std::string getEnv(const char* key, const std::string& fallback) {
        const char* value = std::getenv(key);
        return value ? std::string(value) : fallback;
    }
};