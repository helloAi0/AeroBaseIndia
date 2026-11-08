#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class BoardingPassController : public drogon::HttpController<BoardingPassController>
{
public:
    METHOD_LIST_BEGIN
    // Dynamic route to handle specific booking IDs
    ADD_METHOD_TO(BoardingPassController::generatePass, "/api/passenger/boarding-pass/{1}", Get);
    METHOD_LIST_END

    void generatePass(const HttpRequestPtr& req,
                      std::function<void(const HttpResponsePtr&)>&& callback,
                      std::string bookingId);
};