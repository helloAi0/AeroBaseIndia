#include <drogon/drogon.h>
#include "../middleware/AuthMiddleware.h"
#include "../repositories/GateRepository.h"

using namespace drogon;

class GateController : public HttpController<GateController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(GateController::getAvailableGates, "/gates", Get);
    METHOD_LIST_END

    void getAvailableGates(const HttpRequestPtr& req,
                            std::function<void(const HttpResponsePtr&)>&& callback) {
        std::string tenantId;

        if (!AuthMiddleware::validate(req, tenantId)) {
            // FIX: Create response first, then set status code to satisfy the compiler
            auto resp = HttpResponse::newHttpResponse();
            resp->setStatusCode(k401Unauthorized);
            callback(resp);
            return;
        }

        auto gates = GateRepository::getAllAvailableGates(tenantId);

        Json::Value response(Json::arrayValue);

        for (const auto& gate : gates) {
            Json::Value item;
            item["terminal"] = gate.terminal;
            item["gate_code"] = gate.gateCode;
            item["status"] = gate.status;
            response.append(item);
        }

        callback(HttpResponse::newHttpJsonResponse(response));
    }
};