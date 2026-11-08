#pragma once
#include <string>
#include <unordered_map>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <random>
#include <vector>
#include <mutex>

struct Span {
    std::string traceId;
    std::string spanId;
    std::string parentSpanId;
    std::string operationName;
    std::string service;
    std::string tenantId;
    long long   startMs  = 0;
    long long   endMs    = 0;
    int         status   = 200;
    std::unordered_map<std::string, std::string> tags;

    long long durationMs() const { return endMs - startMs; }

    std::string toJson() const {
        std::ostringstream o;
        o << "{"
          << "\"traceId\":\"" << traceId << "\","
          << "\"spanId\":\""  << spanId  << "\","
          << "\"parentSpanId\":\"" << parentSpanId << "\","
          << "\"operation\":\"" << operationName << "\","
          << "\"service\":\"" << service << "\","
          << "\"tenantId\":\"" << tenantId << "\","
          << "\"startMs\":"  << startMs  << ","
          << "\"endMs\":"    << endMs    << ","
          << "\"durationMs\":" << durationMs() << ","
          << "\"status\":"   << status;
        if (!tags.empty()) {
            o << ",\"tags\":{";
            bool first = true;
            for (auto& [k,v] : tags) {
                if (!first) o << ",";
                o << "\"" << k << "\":\"" << v << "\"";
                first = false;
            }
            o << "}";
        }
        o << "}";
        return o.str();
    }
};

class Tracer {
public:
    static Tracer& getInstance();

    // Generate IDs
    static std::string newTraceId();
    static std::string newSpanId();

    // Create and finish spans
    Span  startSpan(const std::string& operation,
                    const std::string& traceId    = "",
                    const std::string& parentSpan = "");
    void  finishSpan(Span& span, int status = 200);

    // Add tag to span
    static void addTag(Span& span,
                       const std::string& key,
                       const std::string& value);

    // Export all completed spans (last N)
    std::vector<Span> getRecentSpans(int limit = 50);

    // Export as JSON array
    std::string exportJson(int limit = 50);

private:
    Tracer() = default;
    std::mutex          mutex_;
    std::vector<Span>   completed_;
    static const int    MAX_STORED = 500;
};
