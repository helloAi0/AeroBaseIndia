#pragma once
#include "../services/JwtService.h"
#include <drogon/drogon.h>

class AuthMiddleware {
public:
    static bool validate(const drogon::HttpRequestPtr& req,
                         std::string& tenantId) {
        auto authHeader = req->getHeader("Authorization");

        if (authHeader.empty())
            return false;

        std::string token = authHeader.substr(7);

        auto decoded = JwtService::verifyToken(token);
        tenantId = decoded.get_payload_claim("tenant_id").as_string();

        return true;
    }
};