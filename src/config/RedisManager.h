#pragma once
#include <hiredis/hiredis.h>
#include <cstdlib>
#include <string>

// One Redis connection per thread (hiredis contexts are not thread-safe), configured from the environment:
//   REDIS_HOST (default 127.0.0.1), REDIS_PORT (default 6379), REDIS_PASSWORD (optional).
// A broken connection is re-established on the next call. Callers must still check ctx->err / reply == nullptr.
class RedisManager {
public:
    static redisContext* getConnection() {
        thread_local redisContext* ctx = nullptr;
        if (ctx && ctx->err) { redisFree(ctx); ctx = nullptr; }
        if (!ctx) {
            const char* h = std::getenv("REDIS_HOST"); const char* p = std::getenv("REDIS_PORT"); const char* pw = std::getenv("REDIS_PASSWORD");
            const int port = p && *p ? std::atoi(p) : 6379;
            struct timeval tv{1, 0};
            ctx = redisConnectWithTimeout(h && *h ? h : "127.0.0.1", port > 0 ? port : 6379, tv);
            if (ctx && !ctx->err && pw && *pw) {
                redisReply* r = static_cast<redisReply*>(redisCommand(ctx, "AUTH %s", pw));
                if (!r || r->type == REDIS_REPLY_ERROR) { if (r) freeReplyObject(r); redisFree(ctx); ctx = nullptr; return nullptr; }
                freeReplyObject(r);
            }
            if (ctx) { struct timeval cmd{1, 0}; redisSetTimeout(ctx, cmd); }
        }
        return ctx;
    }
};
