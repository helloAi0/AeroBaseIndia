#include "AuthService.h"
#include "JwtService.h"
#include "PasswordService.h"
#include "../config/DatabaseManager.h"
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

std::optional<AuthService::LoginResult>
AuthService::authenticate(const std::string& email, const std::string& password) {
    // Verified against this when the email is unknown, so both failures take the same time.
    static const std::string kDummyHash = PasswordService::hashPassword("timing-equaliser");

    // Own connection: the shared one in DatabaseManager is not thread-safe.
    auto conn = DatabaseManager::makeConnection();
    pqxx::work tx(conn);

    const auto rows = tx.exec_params(
        "SELECT u.id, u.tenant_id, u.full_name, u.email, u.password_hash, u.role, "
        "       t.airport_code, t.airport_name "
        "FROM users u LEFT JOIN tenants t ON t.id = u.tenant_id "
        "WHERE lower(u.email) = lower($1) "
        "ORDER BY (u.email = $1) DESC LIMIT 1",
        email);

    if (rows.empty()) {
        PasswordService::verifyPassword(password, kDummyHash);
        return std::nullopt;
    }

    const auto& r = rows[0];
    auto str = [&](const char* col) { return r[col].is_null() ? std::string() : std::string(r[col].c_str()); };

    const std::string stored = str("password_hash");
    if (!PasswordService::verifyPassword(password, stored)) return std::nullopt;

    // Transparently upgrade legacy SHA-256 (or weaker PBKDF2) hashes after a successful login.
    if (PasswordService::needsRehash(stored)) {
        tx.exec_params("UPDATE users SET password_hash = $1 WHERE id = $2",
                       PasswordService::hashPassword(password), str("id"));
    }
    tx.commit();

    LoginResult out;
    out.userId      = str("id");
    out.name        = str("full_name");
    out.email       = str("email");
    out.role        = str("role");
    out.airportCode = str("airport_code");
    out.airportName = str("airport_name");
    out.token = JwtService::generateToken({
        {"user_id",      out.userId},
        {"tenant_id",    str("tenant_id")},
        {"role",         out.role},
        {"name",         out.name},
        {"email",        out.email},
        {"airport",      out.airportCode},
        {"airport_name", out.airportName},
    });
    return out;
}

std::string AuthService::login(const std::string& email, const std::string& password) {
    const auto r = authenticate(email, password);
    return r ? r->token : std::string();
}
