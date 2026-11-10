#pragma once
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <string>

/** Refuses to boot in production with default/weak infrastructure secrets (JWT is checked in JwtService::init). */
namespace StartupChecks {
inline bool isProduction() { const char* e = std::getenv("AEROBASE_ENV"); return e && std::string(e) == "production"; }

inline bool weakSecret(std::string v) {
    std::transform(v.begin(), v.end(), v.begin(), ::tolower);
    if (v.size() < 12) return true;
    for (const char* bad : {"password", "postgres", "changeme", "change_me", "replace", "secret", "123456", "admin", "redis"})
        if (v.find(bad) != std::string::npos) return true;
    return false;
}

inline void run() {
    if (!isProduction()) return;
    const char* db = std::getenv("DB_PASSWORD");
    if (!db || weakSecret(db)) {
        std::cerr << "[FATAL] AEROBASE_ENV=production but DB_PASSWORD is missing or weak "
                     "(need >= 12 chars and no default words). Generate one with scripts/init-prod-env.sh." << std::endl;
        std::exit(1);
    }
    const char* host = std::getenv("DB_HOST");
    if (!host || std::string(host).empty()) {
        std::cerr << "[FATAL] AEROBASE_ENV=production but DB_HOST is not set." << std::endl;
        std::exit(1);
    }
}
} // namespace StartupChecks
