#pragma once
#include <algorithm>
#include <chrono>
#include <deque>
#include <map>
#include <mutex>
#include <string>

/** In-memory brute-force protection for /login (per process). Failures are counted per (ip,email) and per ip. */
class LoginThrottle {
public:
    static constexpr size_t kPerAccount = 5;    // failures per window for one (ip,email)
    static constexpr size_t kPerIp      = 30;   // failures per window for one ip
    static constexpr int    kWindowSec  = 900;  // 15 minutes

    /// Returns 0 if allowed, otherwise seconds until the client may retry.
    static int blockedFor(const std::string& ip, const std::string& email) {
        std::lock_guard<std::mutex> l(mu());
        auto now = Clock::now();
        return std::max(retry(map()[ip + "|" + lower(email)], kPerAccount, now), retry(map()["ip|" + ip], kPerIp, now));
    }
    static void recordFailure(const std::string& ip, const std::string& email) {
        std::lock_guard<std::mutex> l(mu());
        auto now = Clock::now();
        map()[ip + "|" + lower(email)].push_back(now);
        map()["ip|" + ip].push_back(now);
        if (map().size() > 20000) prune(now);
    }
    static void recordSuccess(const std::string& ip, const std::string& email) {
        std::lock_guard<std::mutex> l(mu());
        map().erase(ip + "|" + lower(email));
    }

private:
    using Clock = std::chrono::steady_clock;
    static std::mutex& mu() { static std::mutex m; return m; }
    static std::map<std::string, std::deque<Clock::time_point>>& map() { static std::map<std::string, std::deque<Clock::time_point>> m; return m; }
    static std::string lower(std::string s) { std::transform(s.begin(), s.end(), s.begin(), ::tolower); return s; }
    static int retry(std::deque<Clock::time_point>& q, size_t limit, Clock::time_point now) {
        while (!q.empty() && now - q.front() > std::chrono::seconds(kWindowSec)) q.pop_front();
        if (q.size() < limit) return 0;
        return std::max<int>(1, kWindowSec - (int)std::chrono::duration_cast<std::chrono::seconds>(now - q.front()).count());
    }
    static void prune(Clock::time_point now) {
        for (auto it = map().begin(); it != map().end();) {
            while (!it->second.empty() && now - it->second.front() > std::chrono::seconds(kWindowSec)) it->second.pop_front();
            it = it->second.empty() ? map().erase(it) : std::next(it);
        }
    }
};
