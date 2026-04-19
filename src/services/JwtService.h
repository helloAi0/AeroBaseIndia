#pragma once
#include <jwt-cpp/jwt.h>
#include <string>

class JwtService {
private:
    static constexpr const char* SECRET = "AERObase_SUPER_SECRET_KEY";

public:
    static std::string generateToken(const std::string& userId,
                                     const std::string& tenantId,
                                     const std::string& role) {
        return jwt::create()
            .set_type("JWT")
            .set_issuer("AeroBaseIndia")
            .set_payload_claim("user_id", jwt::claim(userId))
            .set_payload_claim("tenant_id", jwt::claim(tenantId))
            .set_payload_claim("role", jwt::claim(role))
            .sign(jwt::algorithm::hs256{SECRET});
    }

    // Use 'auto' here so C++ handles the complex internal template type for us
    static auto verifyToken(const std::string& token) {
        auto decoded = jwt::decode(token);

        jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{SECRET})
            .with_issuer("AeroBaseIndia")
            .verify(decoded);

        return decoded;
    }
};