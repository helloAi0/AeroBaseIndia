#pragma once
#include <string>

class AuthService {
public:
    static std::string generateUUID();
    static std::string hashPassword(const std::string& plain);
    static bool        verifyPassword(const std::string& plain,
                                      const std::string& hashed);
    static std::string login(const std::string& email,
                             const std::string& password);
};
