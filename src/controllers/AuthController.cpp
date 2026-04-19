#include <drogon/drogon.h>
#include "../services/AuthService.h"

using namespace drogon;

class AuthController : public HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AuthController::loginUser, "/login", Post);
    METHOD_LIST_END

    void loginUser(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& callback) {
        auto json = req->getJsonObject();

        try {
            std::string email = (*json)["email"].asString();
            std::string password = (*json)["password"].asString();

            std::string token = AuthService::login(email, password);

            Json::Value response;
            response["token"] = token;

            auto resp = HttpResponse::newHttpJsonResponse(response);
            callback(resp);

        } catch (const std::exception& ex) {
            Json::Value error;
            error["error"] = ex.what();
            callback(HttpResponse::newHttpJsonResponse(error));
        }
    }
};