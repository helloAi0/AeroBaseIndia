#pragma once
#include <drogon/HttpMiddleware.h>
#include "../core/Logger.h"
#include <chrono>

using namespace drogon;

class PerformanceMiddleware : public HttpMiddleware<PerformanceMiddleware> {
public:
    /**
     * invoke() is called for every incoming request.
     * We start the timer here and "wrap" the callback to stop it.
     */
    void invoke(const HttpRequestPtr &req, 
                AdviceCallback &&acb, 
                AdviceChainCallback &&accb) override {
        
        auto start = std::chrono::steady_clock::now();

        // accb is the "Advice Chain Callback" (the next step in the pipeline)
        accb([req, start, acb = std::move(acb)](const HttpResponsePtr &resp) {
            auto end = std::chrono::steady_clock::now();
            auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();

            // Use the JSON structured logger we built earlier
            std::string logMsg = "Method: " + std::string(req->methodString()) + 
                                 " | Path: " + req->path() + 
                                 " | Latency: " + std::to_string(ms) + "ms";
            
            Logger::info(logMsg);

            // Pass the response back to the client
            acb(resp);
        });
    }
};