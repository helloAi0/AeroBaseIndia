#include <drogon/drogon.h>

using namespace drogon;

class MetricsController : public HttpController<MetricsController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(MetricsController::metrics, "/metrics", Get);
    METHOD_LIST_END

    void metrics(const HttpRequestPtr&,
                 std::function<void(const HttpResponsePtr&)>&& callback) {
        Json::Value response;
        response["service"] = "AeroBase India";
        response["version"] = "1.0";
        response["uptime"] = "running";

        callback(HttpResponse::newHttpJsonResponse(response));
    }
};