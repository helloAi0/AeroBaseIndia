#pragma once
#include <drogon/HttpController.h>

using namespace drogon;

class ManifestController : public HttpController<ManifestController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(ManifestController::uploadManifest, "/api/partner/flights/{1}/manifest", Post, "PartnerAuthFilter");
    METHOD_LIST_END

    void uploadManifest(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback, std::string flightId);
};