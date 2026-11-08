#include "MetricsRegistry.h"
#include <sstream>
#include <iomanip>

MetricsRegistry& MetricsRegistry::getInstance() {
    static MetricsRegistry inst;
    return inst;
}

void MetricsRegistry::incrementCounter(const std::string& name,
                                        const std::string& labels) {
    std::lock_guard<std::mutex> lock(mutex_);
    counters_[name + labels]++;
}

void MetricsRegistry::setGauge(const std::string& name, double value,
                                 const std::string& labels) {
    std::lock_guard<std::mutex> lock(mutex_);
    gauges_[name + labels] = value;
}

void MetricsRegistry::incrementGauge(const std::string& name,
                                      const std::string& labels) {
    std::lock_guard<std::mutex> lock(mutex_);
    gauges_[name + labels]++;
}

void MetricsRegistry::decrementGauge(const std::string& name,
                                      const std::string& labels) {
    std::lock_guard<std::mutex> lock(mutex_);
    gauges_[name + labels]--;
}

void MetricsRegistry::observeHistogram(const std::string& name,
                                        double valueMs,
                                        const std::string& labels) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto& h = histograms_[name + labels];
    h.sum += valueMs;
    h.total++;
    for (size_t i = 0; i < h.buckets.size(); i++)
        if (valueMs <= h.buckets[i]) h.counts[i]++;
}

void MetricsRegistry::recordRequest(const std::string& path,
                                     const std::string& method,
                                     int statusCode,
                                     double durationMs) {
    std::string labels = "{path=\"" + path +
                         "\",method=\"" + method +
                         "\",status=\"" + std::to_string(statusCode) + "\"}";
    incrementCounter("aerobase_http_requests_total", labels);
    observeHistogram("aerobase_http_duration_ms", durationMs, labels);
}

std::string MetricsRegistry::exportPrometheus() {
    std::lock_guard<std::mutex> lock(mutex_);
    std::ostringstream out;

    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();

    out << "# HELP aerobase_http_requests_total Total HTTP requests\n";
    out << "# TYPE aerobase_http_requests_total counter\n";
    for (auto& [k, v] : counters_)
        out << k << " " << v << " " << now << "\n";

    out << "# HELP aerobase_active_requests Active requests\n";
    out << "# TYPE aerobase_active_requests gauge\n";
    for (auto& [k, v] : gauges_)
        out << k << " " << v << " " << now << "\n";

    out << "# HELP aerobase_http_duration_ms Request duration ms\n";
    out << "# TYPE aerobase_http_duration_ms histogram\n";
    for (auto& [k, h] : histograms_) {
        for (size_t i = 0; i < h.buckets.size(); i++)
            out << k << "_bucket{le=\"" << h.buckets[i] << "\"} "
                << h.counts[i] << " " << now << "\n";
        out << k << "_bucket{le=\"+Inf\"} " << h.total << " " << now << "\n";
        out << k << "_sum "   << h.sum   << " " << now << "\n";
        out << k << "_count " << h.total << " " << now << "\n";
    }

    out << "# HELP aerobase_info Service info\n";
    out << "# TYPE aerobase_info gauge\n";
    out << "aerobase_info{service=\"AeroBaseIndia\",version=\"1.0\"} 1 " << now << "\n";

    return out.str();
}
