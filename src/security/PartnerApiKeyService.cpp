#include "PartnerApiKeyService.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>

std::string PartnerApiKeyService::hashKey(const std::string& rawKey) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, rawKey.c_str(), rawKey.size());
    SHA256_Final(hash, &sha256);

    std::stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}

std::string PartnerApiKeyService::createKeyForPartner(const std::string& partnerId, const std::string& tenantId) {
    // 1. Generate 64-character Secure Token
    unsigned char buffer[32]; // 32 bytes = 64 hex chars
    RAND_bytes(buffer, sizeof(buffer));
    
    std::stringstream ss;
    for(int i = 0; i < 32; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)buffer[i];
    }
    std::string rawKey = "ab_" + ss.str(); // Prefix for easy identification

    // 2. Hash the key for storage
    std::string hashedKey = hashKey(rawKey);

    // 3. Store in Database
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        txn.exec_params(
            "INSERT INTO partner_api_keys (partner_id, tenant_id, key_hash) VALUES ($1, $2, $3)",
            partnerId, tenantId, hashedKey
        );
        txn.commit();
        
        return rawKey; // Return the raw key to be displayed to the partner ONCE
    } catch (const std::exception& e) {
        Logger::error("API Key Generation Failed: " + std::string(e.what()));
        return "";
    }
}

bool PartnerApiKeyService::verifyKey(const std::string& partnerId, const std::string& rawKey) {
    const std::string providedHash = hashKey(rawKey);
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        auto result = txn.exec_params(
            "UPDATE partner_api_keys SET last_used_at = NOW() "
            "WHERE partner_id = $1 AND key_hash = $2 AND is_active = TRUE RETURNING 1",
            partnerId, providedHash);
        txn.commit();
        return !result.empty();
    } catch (...) {
        return false;
    }
}

std::string PartnerApiKeyService::tenantFor(const std::string& partnerId) {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto r = txn.exec_params("SELECT COALESCE(tenant_id::text,'') FROM partner_api_keys WHERE partner_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1", partnerId);
        return r.empty() ? "" : r[0][0].c_str();
    } catch (...) { return ""; }
}