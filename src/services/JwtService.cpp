#include "JwtService.h"

static const std::string SECRET = "aerobase_secret_key_2024";

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
    auto builder = jwt::create().set_issuer("aerobase").set_type("JWT");
    for (auto& [k, v] : claims)
        builder.set_payload_claim(k, jwt::claim(v));
    return builder.sign(jwt::algorithm::hs256{SECRET});
}

jwt::decoded_jwt<jwt::traits::kazuho_picojson>
JwtService::verifyToken(const std::string& token) {
    auto verifier = jwt::verify()
        .allow_algorithm(jwt::algorithm::hs256{SECRET})
        .with_issuer("aerobase");
    auto decoded = jwt::decode(token);
    verifier.verify(decoded);
    return decoded;
}