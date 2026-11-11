#include "AirlineFlightController.h"
#include "../config/DatabaseManager.h"
#include "../security/PartnerApiKeyService.h"
#include <regex>

// POST /api/partner/flights/sync   (X-API-Key + X-Partner-Id, enforced by PartnerAuthFilter)
// Body: {flight_number, origin, destination, departure_time "YYYY-MM-DD HH:MM[:SS]", arrival_time?, gate?}
void AirlineFlightController::syncFlight(const HttpRequestPtr& req, std::function<void(const HttpResponsePtr&)>&& callback) {
    auto bad = [&](const char* m, HttpStatusCode c = k400BadRequest) {
        Json::Value e; e["error"] = m;
        auto r = HttpResponse::newHttpJsonResponse(e); r->setStatusCode(c); callback(r);
    };
    auto json = req->getJsonObject();
    if (!json || !json->isObject()) return bad("JSON body required");

    const std::string partnerId = req->attributes()->get<std::string>("verified_partner_id");
    const std::string tenantId = PartnerApiKeyService::tenantFor(partnerId);
    if (tenantId.empty()) return bad("API key is not linked to an airport", k403Forbidden);

    const std::string flightNum = (*json)["flight_number"].asString();
    const std::string origin = (*json)["origin"].asString();
    const std::string dest = (*json)["destination"].asString();
    const std::string dep = (*json)["departure_time"].asString();
    std::string arr = (*json)["arrival_time"].asString();
    std::string gate = (*json)["gate"].asString();

    static const std::regex fnRe("^[A-Z0-9]{2}[- ]?[0-9]{1,4}[A-Z]?$");
    static const std::regex tsRe("^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?$");
    if (!std::regex_match(flightNum, fnRe)) return bad("flight_number must look like AI-101");
    if (origin.empty() || origin.size() > 100 || dest.empty() || dest.size() > 100) return bad("origin and destination required");
    if (!std::regex_match(dep, tsRe)) return bad("departure_time must be YYYY-MM-DD HH:MM");
    if (!arr.empty() && !std::regex_match(arr, tsRe)) return bad("arrival_time must be YYYY-MM-DD HH:MM");
    if (gate.size() > 20) return bad("gate too long");

    try {
        auto conn = DatabaseManager::getConnection();
        pqxx::work txn(*conn);
        // Idempotent upsert per (airport, flight number, departure). Arrival defaults to departure + 2h.
        txn.exec_params(
            "INSERT INTO flights (id, tenant_id, flight_number, origin, destination, departure_time, arrival_time, gate, status, airline_partner_id) "
            "VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5::timestamp, COALESCE(NULLIF($6,'')::timestamp, $5::timestamp + INTERVAL '2 hours'), NULLIF($7,''), 'Scheduled', $8) "
            "ON CONFLICT (tenant_id, flight_number, departure_time) DO UPDATE SET "
            "origin = EXCLUDED.origin, destination = EXCLUDED.destination, arrival_time = EXCLUDED.arrival_time, "
            "gate = COALESCE(EXCLUDED.gate, flights.gate), airline_partner_id = EXCLUDED.airline_partner_id, updated_at = CURRENT_TIMESTAMP",
            tenantId, flightNum, origin, dest, dep, arr, gate, partnerId);
        txn.commit();
        Json::Value res; res["message"] = "Flight synchronized successfully"; res["flight_number"] = flightNum;
        callback(HttpResponse::newHttpJsonResponse(res));
    } catch (const std::exception&) {
        bad("Internal server error", k500InternalServerError);
    }
}
