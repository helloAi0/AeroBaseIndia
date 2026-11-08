#pragma once
#include <string>
#include <unordered_map>

namespace security {

class EnvLoader {
public:
    static bool load(const std::string& path = ".env");
    static std::string get(const std::string& key,
                           const std::string& fallback = "");
};

}
