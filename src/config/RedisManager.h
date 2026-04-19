#pragma once
#include <hiredis/hiredis.h>
#include <memory>

class RedisManager {
public:
    static redisContext* getConnection() {
        static redisContext* context =
            redisConnect("127.0.0.1", 6379);

        return context;
    }
};