#pragma once
#include <string>

struct Gate {
    std::string id;
    std::string tenantId;
    std::string terminal;
    std::string gateCode;
    std::string status;
};