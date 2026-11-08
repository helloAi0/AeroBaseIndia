#include "RequestTimer.h"
#include <iostream>

void RequestTimer::logRequest(
    const std::string& path,
    std::chrono::steady_clock::time_point start)
{
    auto end = std::chrono::steady_clock::now();

    auto ms = std::chrono::duration_cast<
        std::chrono::milliseconds>(end - start).count();

    std::cout << "[REQUEST] "
              << path
              << " took "
              << ms
              << " ms"
              << std::endl;
}
