#pragma once
#include <pqxx/pqxx>
#include <memory>

class DatabaseManager {
public:
    static std::shared_ptr<pqxx::connection> getConnection() {
        static auto conn = std::make_shared<pqxx::connection>(
            "host=127.0.0.1 port=5432 dbname=aerobase "
            "user=postgres password=postgres"
        );
        return conn;
    }
};
