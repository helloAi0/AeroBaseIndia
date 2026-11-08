#include "AuthService.h"
#include "PasswordService.h"
#include <uuid/uuid.h>

std::string AuthService::generateUUID() {
    uuid_t uuid;
    uuid_generate(uuid);
    char str[37];
    uuid_unparse(uuid, str);
    return std::string(str);
}

std::string AuthService::hashPassword(const std::string& plain) {
    return PasswordService::hashPassword(plain);
}

bool AuthService::verifyPassword(const std::string& plain,
                                  const std::string& hashed) {
    return PasswordService::verifyPassword(plain, hashed);
}

std::string AuthService::login(const std::string& email,
                                const std::string& password) {
    (void)email; (void)password;
    return "";
}