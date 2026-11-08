#pragma once

#include <jwt-cpp/jwt.h>
#include <string>
#include <map>

class JwtService {
public:
    // Convenience overload used by AuthService
    static std::string generateToken(const std::string& userId,
                                     const std::string& tenantId,
                                     const std::string& role);

    // Generic map-based generator
    static std::string generateToken(const std::map<std::string, std::string>& claims);

    // Verify and return decoded token
    static jwt::decoded_jwt<jwt::traits::kazuho_picojson>
    verifyToken(const std::string& token);
};
