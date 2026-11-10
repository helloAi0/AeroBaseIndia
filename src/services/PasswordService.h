#pragma once

#include <openssl/crypto.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/sha.h>

#include <cstdlib>
#include <iomanip>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

/**
 * Password hashing.
 *
 * New hashes:  pbkdf2$<iterations>$<salt hex>$<derived key hex>   (PBKDF2-HMAC-SHA256, random salt)
 * Legacy:      64-char hex SHA-256 (unsalted). Still VERIFIED so existing accounts keep working;
 *              needsRehash() tells callers to upgrade the stored hash after a successful login.
 */
class PasswordService {
public:
    static constexpr int kDefaultIterations = 600000;   // OWASP guidance for PBKDF2-HMAC-SHA256

    static std::string hashPassword(const std::string& password) {
        std::vector<unsigned char> salt(16);
        if (RAND_bytes(salt.data(), static_cast<int>(salt.size())) != 1)
            throw std::runtime_error("random number generator failure");
        const int iters = iterations();
        return "pbkdf2$" + std::to_string(iters) + "$" + toHex(salt) + "$" +
               toHex(derive(password, salt, iters));
    }

    static bool verifyPassword(const std::string& plain, const std::string& stored) {
        if (stored.rfind("pbkdf2$", 0) == 0) {
            int iters = 0; std::vector<unsigned char> salt, expected;
            if (!parse(stored, iters, salt, expected)) return false;
            const auto dk = derive(plain, salt, iters);
            return dk.size() == expected.size() &&
                   CRYPTO_memcmp(dk.data(), expected.data(), dk.size()) == 0;
        }
        // legacy unsalted SHA-256 hex
        const std::string h = sha256Hex(plain);
        return h.size() == stored.size() && CRYPTO_memcmp(h.data(), stored.data(), h.size()) == 0;
    }

    /// True for legacy hashes and for PBKDF2 hashes made with fewer iterations than configured.
    static bool needsRehash(const std::string& stored) {
        int iters = 0; std::vector<unsigned char> salt, dk;
        if (stored.rfind("pbkdf2$", 0) != 0 || !parse(stored, iters, salt, dk)) return true;
        return iters < iterations();
    }

private:
    static int iterations() {
        const char* v = std::getenv("PASSWORD_PBKDF2_ITERATIONS");
        const long n = v ? std::strtol(v, nullptr, 10) : kDefaultIterations;
        return (n >= 1000 && n <= 5000000) ? static_cast<int>(n) : kDefaultIterations;
    }

    static std::vector<unsigned char> derive(const std::string& pw, const std::vector<unsigned char>& salt, int iters) {
        std::vector<unsigned char> out(32);
        if (PKCS5_PBKDF2_HMAC(pw.c_str(), static_cast<int>(pw.size()), salt.data(), static_cast<int>(salt.size()),
                              iters, EVP_sha256(), static_cast<int>(out.size()), out.data()) != 1)
            throw std::runtime_error("PBKDF2 failure");
        return out;
    }

    static std::string sha256Hex(const std::string& s) {
        unsigned char h[SHA256_DIGEST_LENGTH];
        SHA256(reinterpret_cast<const unsigned char*>(s.data()), s.size(), h);
        return toHex(std::vector<unsigned char>(h, h + SHA256_DIGEST_LENGTH));
    }

    static std::string toHex(const std::vector<unsigned char>& b) {
        std::ostringstream ss;
        for (unsigned char c : b) ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(c);
        return ss.str();
    }

    static bool fromHex(const std::string& s, std::vector<unsigned char>& out) {
        if (s.empty() || s.size() % 2) return false;
        out.clear();
        for (size_t i = 0; i < s.size(); i += 2) {
            char* end = nullptr; const std::string byte = s.substr(i, 2);
            const long v = std::strtol(byte.c_str(), &end, 16);
            if (*end != '\0') return false;
            out.push_back(static_cast<unsigned char>(v));
        }
        return true;
    }

    static bool parse(const std::string& stored, int& iters, std::vector<unsigned char>& salt, std::vector<unsigned char>& dk) {
        const size_t a = stored.find('$'), b = stored.find('$', a + 1), c = stored.find('$', b + 1);
        if (a == std::string::npos || b == std::string::npos || c == std::string::npos) return false;
        const long n = std::strtol(stored.substr(a + 1, b - a - 1).c_str(), nullptr, 10);
        if (n < 1000 || n > 5000000) return false;
        iters = static_cast<int>(n);
        return fromHex(stored.substr(b + 1, c - b - 1), salt) && fromHex(stored.substr(c + 1), dk);
    }
};
