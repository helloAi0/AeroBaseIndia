#include "JwtService.h"

#include <openssl/rand.h>

#include <algorithm>
#include <cctype>
#include <chrono>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <vector>

namespace {

std::string lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::tolower(c); });
    return s;
}

/// Too short, or one of the placeholder / previously hard-coded values.
bool isWeak(const std::string& s) {
    if (s.size() < 32) return true;
    const std::string l = lower(s);
    for (const char* bad : {"change_me", "changeme", "replace", "aerobase_secret_key", "password", "your_secret"})
        if (l.find(bad) != std::string::npos) return true;
    return false;
}

bool isProduction() {
    const char* e = std::getenv("AEROBASE_ENV");
    return e && lower(e) == "production";
}

std::string envSecret() {
    const char* e = std::getenv("JWT_SECRET");
    return e ? e : "";
}

std::string randomHex(size_t bytes) {
    std::vector<unsigned char> b(bytes);
    if (RAND_bytes(b.data(), static_cast<int>(b.size())) != 1) {
        std::cerr << "FATAL: random number generator failure" << std::endl;
        std::exit(1);
    }
    std::ostringstream ss;
    for (unsigned char c : b) ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(c);
    return ss.str();
}

const std::string& secret() {
    static const std::string s = [] {
        const std::string v = envSecret();
        if (!isWeak(v)) return v;
        std::cerr << "WARNING: JWT_SECRET is missing or weak (need >= 32 chars, no placeholder text). "
                     "Using a random per-process secret: tokens will be invalid after a restart."
                  << std::endl;
        return randomHex(32);
    }();
    return s;
}

long ttlSeconds() {
    const char* v = std::getenv("JWT_TTL_SECONDS");
    const long n = v ? std::strtol(v, nullptr, 10) : 8 * 3600;
    return std::clamp(n, 60L, 7L * 24 * 3600);
}

}  // namespace

void JwtService::init() {
    if (isProduction() && isWeak(envSecret())) {
        std::cerr << "FATAL: AEROBASE_ENV=production but JWT_SECRET is missing or weak. "
                     "Generate one with: openssl rand -hex 32" << std::endl;
        std::exit(1);
    }
    (void)secret();
}

std::string JwtService::generateToken(const std::string& userId,
                                       const std::string& tenantId,
                                       const std::string& role) {
    return generateToken({
        {"user_id",   userId},
        {"tenant_id", tenantId},
        {"role",      role}
    });
}

std::string JwtService::generateToken(
    const std::map<std::string, std::string>& claims)
{
    auto builder = jwt::create()
        .set_issuer("aerobase")
        .set_type("JWT")
        .set_issued_now()
        .set_expires_in(std::chrono::seconds(ttlSeconds()));
    for (auto& [k, v] : claims)
        builder.set_payload_claim(k, jwt::claim(v));
    return builder.sign(jwt::algorithm::hs256{secret()});
}

jwt::decoded_jwt<jwt::traits::kazuho_picojson>
JwtService::verifyToken(const std::string& token) {
    auto verifier = jwt::verify()
        .allow_algorithm(jwt::algorithm::hs256{secret()})
        .with_issuer("aerobase");
    auto decoded = jwt::decode(token);
    verifier.verify(decoded);   // also checks exp / nbf / iat when present
    return decoded;
}
