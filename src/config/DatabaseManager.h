#pragma once
#include <pqxx/pqxx>
#include <cstdlib>
#include <memory>
#include <string>

class DatabaseManager {
public:
    /// libpq connection string built from DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
    /// (the variable names docker-compose and the k8s manifests already set).
    /// Defaults equal the previous hard-coded values, so existing local setups keep working.
    static std::string connectionString() {
        return "host="     + quote(env("DB_HOST",     "127.0.0.1")) +
               " port="    + quote(env("DB_PORT",     "5432"))      +
               " dbname="  + quote(env("DB_NAME",     "aerobase"))  +
               " user="    + quote(env("DB_USER",     "postgres"))  +
               " password="+ quote(env("DB_PASSWORD", "postgres"));
    }

    /// Shared connection used by existing controllers. NOTE: a pqxx::connection is not
    /// thread-safe; new code should prefer makeConnection().
    static std::shared_ptr<pqxx::connection> getConnection() {
        static auto conn = std::make_shared<pqxx::connection>(connectionString());
        return conn;
    }

    /// A fresh, independent connection (safe to use from any thread).
    static pqxx::connection makeConnection() {
        return pqxx::connection(connectionString());
    }

private:
    static std::string env(const char* key, const char* fallback) {
        const char* v = std::getenv(key);
        return (v && *v) ? std::string(v) : std::string(fallback);
    }
    /// libpq key/value quoting: wrap in '...' and escape \ and '
    static std::string quote(const std::string& v) {
        std::string out = "'";
        for (char c : v) { if (c == '\\' || c == '\'') out += '\\'; out += c; }
        return out + "'";
    }
};
