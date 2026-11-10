#pragma once

#include <jwt-cpp/jwt.h>
#include <string>
#include <map>

class JwtService {
public:
    /// Call once at startup. Reads JWT_SECRET; with AEROBASE_ENV=production a missing/weak secret
    /// aborts startup. Otherwise a random per-process secret is used (tokens die on restart).
    static void init();

    // Convenience overload used by AuthService
    static std::string generateToken(const std::string& userId,
                                     const std::string& tenantId,
                                     const std::string& role);

    // Generic map-based generator. Adds iat and exp (JWT_TTL_SECONDS, default 8h).
    static std::string generateToken(const std::map<std::string, std::string>& claims);

    // Verify (signature, issuer, exp) and return decoded token
    static jwt::decoded_jwt<jwt::traits::kazuho_picojson>
    verifyToken(const std::string& token);
};
