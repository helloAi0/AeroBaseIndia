#include "TraceContext.h"
#include <random>
#include <sstream>
#include <iomanip>

static std::string randomHex(int bytes) {
    static std::mt19937_64 rng{std::random_device{}()};
    std::uniform_int_distribution<uint64_t> dist;
    std::ostringstream ss;
    for (int i = 0; i < bytes/8; i++)
        ss << std::hex << std::setw(16) << std::setfill('0') << dist(rng);
    return ss.str().substr(0, bytes*2);
}

Tracer& Tracer::getInstance() {
    static Tracer t;
    return t;
}

std::string Tracer::newTraceId() { return randomHex(16); } // 32 hex chars
std::string Tracer::newSpanId()  { return randomHex(8);  } // 16 hex chars

Span Tracer::startSpan(const std::string& operation,
                        const std::string& traceId,
                        const std::string& parentSpan) {
    Span s;
    s.traceId       = traceId.empty() ? newTraceId() : traceId;
    s.spanId        = newSpanId();
    s.parentSpanId  = parentSpan;
    s.operationName = operation;
    s.service       = "AeroBaseIndia";
    s.startMs       = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    return s;
}

void Tracer::finishSpan(Span& span, int status) {
    span.endMs = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    span.status = status;
    std::lock_guard<std::mutex> lock(mutex_);
    completed_.push_back(span);
    if ((int)completed_.size() > MAX_STORED)
        completed_.erase(completed_.begin());
}

void Tracer::addTag(Span& span,
                    const std::string& key,
                    const std::string& value) {
    span.tags[key] = value;
}

std::vector<Span> Tracer::getRecentSpans(int limit) {
    std::lock_guard<std::mutex> lock(mutex_);
    if ((int)completed_.size() <= limit) return completed_;
    return std::vector<Span>(completed_.end() - limit, completed_.end());
}

std::string Tracer::exportJson(int limit) {
    auto spans = getRecentSpans(limit);
    std::ostringstream o;
    o << "[";
    for (size_t i = 0; i < spans.size(); i++) {
        if (i) o << ",";
        o << spans[i].toJson();
    }
    o << "]";
    return o.str();
}
