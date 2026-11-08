#pragma once
#include <string>
#include <unordered_map>

class StaffValidationService {
private:
    static std::unordered_map<std::string, bool> certCache;
public:
    static bool isCertifiedFor(const std::string& userId,
                                const std::string& requiredCert);
};
