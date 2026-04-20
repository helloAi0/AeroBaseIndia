#include <drogon/drogon.h>

using namespace drogon;

class AuditController : public HttpController<AuditController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AuditController::listLogs, "/audit/logs", Get);
    METHOD_LIST_END

    void listLogs(const HttpRequestPtr&,
                  std::function<void(const HttpResponsePtr&)>&& callback) {
        Json::Value response;
        response["message"] = "Audit logs endpoint ready";
        callback(HttpResponse::newHttpJsonResponse(response));
    }
};