#pragma once
#include <optional>
#include <string>

class AuthService {
public:
    struct LoginResult {
        std::string token;
        std::string userId, name, email, role;
        std::string airportCode, airportName;
    };

    static std::string generateUUID();
    static std::string hashPassword(const std::string& plain);
    static bool        verifyPassword(const std::string& plain,
                                      const std::string& hashed);

    /// Checks the credentials against the users table. Returns nullopt for an unknown email
    /// OR a wrong password (callers must not distinguish them). Throws on infrastructure errors.
    static std::optional<LoginResult> authenticate(const std::string& email,
                                                   const std::string& password);

    /// Kept for compatibility: the token, or "" when the credentials are rejected.
    static std::string login(const std::string& email,
                             const std::string& password);
};
