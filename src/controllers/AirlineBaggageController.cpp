#include "AirlineBaggageController.h"
#include "../config/DatabaseManager.h"
#include <drogon/drogon.h>

void AirlineBaggageController::syncBaggage(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto json = req->getJsonObject();
    if (!json) return; // Add error handling in real code

    std::string tagId = (*json)["tag_id"].asString();
    std::string status = (*json)["status"].asString();

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);

        // MAANG Logic: Idempotent state update
        txn.exec_params(
            "UPDATE baggage SET status = $1, updated_at = CURRENT_TIMESTAMP "
            "WHERE tag_id = $2",
            status, tagId
        );
        txn.commit();

        Json::Value res;
        res["message"] = "Baggage synchronized";
        callback(HttpResponse::newHttpJsonResponse(res));
    } catch (...) {
        // Handle error
    }
}