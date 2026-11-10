#include <drogon/drogon.h>
#include "../services/AuthService.h"
#include "../services/LoginThrottle.h"

using namespace drogon;

class AuthController : public HttpController<AuthController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(AuthController::loginUser, "/login", Post);
    METHOD_LIST_END

    void loginUser(const HttpRequestPtr& req,
                   std::function<void(const HttpResponsePtr&)>&& callback) {
        auto reply = [&callback](HttpStatusCode code, const Json::Value& body) {
            auto resp = HttpResponse::newHttpJsonResponse(body);
            resp->setStatusCode(code);
            callback(resp);
        };
        auto fail = [&reply](HttpStatusCode code, const char* msg) {
            Json::Value e;
            e["error"] = msg;
            reply(code, e);
        };

        const auto json = req->getJsonObject();
        if (!json || !json->isObject() || !(*json)["email"].isString() || !(*json)["password"].isString())
            return fail(k400BadRequest, "Request body must be JSON with string fields 'email' and 'password'");

        const std::string email    = (*json)["email"].asString();
        const std::string password = (*json)["password"].asString();
        if (email.empty() || password.empty() || email.size() > 254 || password.size() > 1024)
            return fail(k400BadRequest, "Invalid email or password format");

        const std::string ip = req->getPeerAddr().toIp();
        if (int wait = LoginThrottle::blockedFor(ip, email)) {
            Json::Value e; e["error"] = "Too many failed attempts. Try again later.";
            auto resp = HttpResponse::newHttpJsonResponse(e);
            resp->setStatusCode(k429TooManyRequests);
            resp->addHeader("Retry-After", std::to_string(wait));
            callback(resp);
            return;
        }

        try {
            const auto result = AuthService::authenticate(email, password);
            if (!result) {
                LoginThrottle::recordFailure(ip, email);
                return fail(k401Unauthorized, "Invalid credentials");
            }
            LoginThrottle::recordSuccess(ip, email);

            Json::Value user;
            user["id"]           = result->userId;
            user["name"]         = result->name;
            user["email"]        = result->email;
            user["role"]         = result->role;
            user["airport"]      = result->airportCode;
            user["airport_name"] = result->airportName;

            Json::Value ok;
            ok["token"] = result->token;
            ok["user"]  = user;
            reply(k200OK, ok);
        } catch (const std::exception& ex) {
            LOG_ERROR << "login failed: " << ex.what();   // details stay in the log, not the response
            fail(k500InternalServerError, "Login failed");
        }
    }
};
