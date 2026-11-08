#pragma once
#include <string>

class OverageService {
public:
    static double calculateOverageFees(const std::string& tenantId, const std::string& monthYear);
};