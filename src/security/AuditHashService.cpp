#include "AuditHashService.h"
#include "../config/DatabaseManager.h"
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>

std::string AuditHashService::getLatestHash() {
    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::read_transaction txn(*conn);
        auto result = txn.exec("SELECT hash FROM compliance_audit ORDER BY created_at DESC LIMIT 1");
        
        return result.empty() ? "GENESIS_HASH_0000000000000000" : result[0][0].c_str();
    } catch (...) {
        return "GENESIS_HASH_0000000000000000";
    }
}

std::string AuditHashService::calculateChainHash(const std::string& prevHash, const std::string& currentData) {
    std::string input = prevHash + currentData;
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, input.c_str(), input.size());
    SHA256_Final(hash, &sha256);

    std::stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    return ss.str();
}