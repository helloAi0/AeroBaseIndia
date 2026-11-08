#pragma once
#include <string>
#include <json/json.h>

class PartnerApiKeyService {
public:
    /**
     * Generates a new API key for a partner.
     * Returns the RAW key to be shown to the user ONCE.
     */
    static std::string createKeyForPartner(const std::string& partnerId, const std::string& tenantId);

    /**
     * Verifies if a provided raw key matches the stored hash for a partner.
     */
    static bool verifyKey(const std::string& partnerId, const std::string& rawKey);

private:
    static std::string hashKey(const std::string& rawKey);
};