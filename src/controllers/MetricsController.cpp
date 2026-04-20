#include <drogon/drogon.h>
#include "../services/RequestTimer.h" // Optional: if you want to track real time
#include <string>

using namespace drogon;

class MetricsController : public HttpController<MetricsController> {
public:
    METHOD_LIST_BEGIN
        // Standard Prometheus scraping endpoint
        ADD_METHOD_TO(MetricsController::getMetrics, "/metrics", Get);
    METHOD_LIST_END

    void getMetrics(const HttpRequestPtr& req,
                    std::function<void(const HttpResponsePtr&)>&& callback) {
        
        // 1. Construct Prometheus-formatted strings
        // Format: metric_name{label="value"} value
        std::string output;
        
        // Static Info Metrics
        output += "# HELP aerobase_info Information about the AeroBase service\n";
        output += "aerobase_info{version=\"1.0.0\", status=\"running\"} 1\n";

        // Real-time counters (These should eventually pull from a global atomic counter)
        output += "# HELP aerobase_requests_total Total number of HTTP requests handled\n";
        output += "# TYPE aerobase_requests_total counter\n";
        output += "aerobase_requests_total 1245\n";

        output += "# HELP aerobase_active_flights Number of flights currently being tracked\n";
        output += "# TYPE aerobase_active_flights gauge\n";
        output += "aerobase_active_flights 82\n";

        // 2. Return as Plain Text (Required for Prometheus)
        auto resp = HttpResponse::newHttpResponse();
        resp->setStatusCode(k200OK);
        resp->setContentTypeCode(CT_TEXT_PLAIN); // Important: Not JSON
        resp->setBody(output);
        
        callback(resp);
    }
};