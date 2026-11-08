#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <atomic>
#include <mutex>
#include <chrono>
#include <sstream>

class MetricsRegistry {
public:
    static MetricsRegistry& getInstance();

    void incrementCounter(const std::string& name, const std::string& labels = "");
    void setGauge(const std::string& name, double value, const std::string& labels = "");
    void incrementGauge(const std::string& name, const std::string& labels = "");
    void decrementGauge(const std::string& name, const std::string& labels = "");
    void observeHistogram(const std::string& name, double valueMs, const std::string& labels = "");
    void recordRequest(const std::string& path, const std::string& method, int statusCode, double durationMs);
    std::string exportPrometheus();

private:
    MetricsRegistry() = default;
    std::mutex mutex_;

    struct Histogram {
        std::vector<double> buckets{5,10,25,50,100,250,500,1000,2500};
        std::vector<long>   counts = std::vector<long>(9, 0);
        double              sum   = 0.0;
        long                total = 0;
    };

    std::unordered_map<std::string, long>      counters_;
    std::unordered_map<std::string, double>    gauges_;
    std::unordered_map<std::string, Histogram> histograms_;
};
