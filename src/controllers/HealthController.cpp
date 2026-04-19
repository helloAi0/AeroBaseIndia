#include <drogon/drogon.h>
#include "../services/HealthService.h" // Ensure this exists

using namespace drogon;

class HealthController : public HttpController<HealthController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(HealthController::health, "/health", Get);
    METHOD_LIST_END

    void health(const HttpRequestPtr&,
                std::function<void(const HttpResponsePtr&)>&& callback) {
        
        Json::Value response;
        response["service"] = "AeroBase India";
        
        // This checks if the PostgreSQL connection pool is alive
        response["database"] = HealthService::databaseHealthy();

        auto resp = HttpResponse::newHttpJsonResponse(response);
        
        // Professional Touch: If DB is down, return 503 Service Unavailable
        if (!response["database"].asBool()) {
            resp->setStatusCode(k503ServiceUnavailable);
        }

        callback(resp);
    }
};