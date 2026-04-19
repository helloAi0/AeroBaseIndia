#include <drogon/drogon.h>
#include "../services/BillingService.h"

using namespace drogon;

class BillingController : public HttpController<BillingController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(BillingController::createInvoiceApi, "/billing/invoice", Post);
    METHOD_LIST_END

    void createInvoiceApi(const HttpRequestPtr& req,
                          std::function<void(const HttpResponsePtr&)>&& callback) {
        auto json = req->getJsonObject();

        Invoice invoice = BillingService::generateInvoice(
            (*json)["tenant_id"].asString(),
            (*json)["subscription_id"].asString(),
            (*json)["amount"].asDouble()
        );

        BillingRepository::createInvoice(invoice);

        Json::Value response;
        response["invoice_id"] = invoice.id;
        response["status"] = "created";

        callback(HttpResponse::newHttpJsonResponse(response));
    }
};