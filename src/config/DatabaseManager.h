#pragma once
#include <pqxx/pqxx>
#include <cstdlib>
#include <memory>
#include <chrono>
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

    /// Per-thread connection (a pqxx::connection is not thread-safe, and Drogon serves requests on
    /// several IO threads). It is validated at most every 5s and transparently re-created if the
    /// database was restarted or the connection dropped, so a DB blip never needs a server restart.
    static std::shared_ptr<pqxx::connection> getConnection() {
        thread_local std::shared_ptr<pqxx::connection> conn;
        thread_local std::chrono::steady_clock::time_point lastCheck{};
        const auto now = std::chrono::steady_clock::now();
        if (conn && now - lastCheck < std::chrono::seconds(5)) return conn;
        if (conn) {
            try { pqxx::nontransaction t(*conn); t.exec("SELECT 1"); lastCheck = now; return conn; }
            catch (const std::exception&) { conn.reset(); }
        }
        conn = std::make_shared<pqxx::connection>(connectionString());   // throws if the DB is unreachable
        lastCheck = now;
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
