#pragma once
#include <string>
#include <json/json.h>

class AuditHashService {
public:
    // Calculates the hash for the current record linked to the previous one
    static std::string calculateChainHash(const std::string& prevHash, const std::string& currentData);
    
    // Retrieves the latest hash from the database to continue the chain
    static std::string getLatestHash();
};