#include <drogon/drogon.h>
#include <pqxx/pqxx>
#include "../config/DatabaseManager.h"

using namespace drogon;

// Read-only reference data for any signed-in user: GET /api/reference/airports | airlines | aircraft
class ReferenceController : public HttpController<ReferenceController> {
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(ReferenceController::get, "/api/reference/{1}", Get);
    METHOD_LIST_END

    void get(const HttpRequestPtr&, std::function<void(const HttpResponsePtr&)>&& cb, std::string kind) {
        auto send = [&](const Json::Value& v, HttpStatusCode c) { auto r = HttpResponse::newHttpJsonResponse(v); r->setStatusCode(c); cb(r); };
        try {
            const char* sql = kind == "airports" ? "SELECT iata, icao, name, city, country, lat, lon FROM reference_airports ORDER BY (country<>'IN'), iata"
                            : kind == "airlines" ? "SELECT iata, icao, name, country, active FROM reference_airlines ORDER BY iata"
                            : kind == "aircraft" ? "SELECT type_code, name, seats, fuel_kg_per_hour, range_km, cruise_kmh FROM reference_aircraft ORDER BY type_code" : nullptr;
            if (!sql) { Json::Value e; e["error"] = "Unknown reference set"; return send(e, k404NotFound); }
            auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn); auto rows = t.exec(sql);
            Json::Value arr(Json::arrayValue);
            for (const auto& r : rows) {
                Json::Value o;
                if (kind == "airports") { o["iata"] = r[0].c_str(); o["icao"] = r[1].c_str(); o["name"] = r[2].c_str(); o["city"] = r[3].c_str(); o["country"] = r[4].c_str(); o["lat"] = r[5].as<double>(); o["lon"] = r[6].as<double>(); }
                else if (kind == "airlines") { o["iata"] = r[0].c_str(); o["icao"] = r[1].c_str(); o["name"] = r[2].c_str(); o["country"] = r[3].c_str(); o["active"] = r[4].as<bool>(); }
                else { o["type"] = r[0].c_str(); o["name"] = r[1].c_str(); o["seats"] = r[2].as<int>(); o["fuel_kg_per_hour"] = r[3].as<int>(); o["range_km"] = r[4].as<int>(); o["cruise_kmh"] = r[5].as<int>(); }
                arr.append(o);
            }
            Json::Value out; out[kind] = arr; send(out, k200OK);
        } catch (const std::exception&) { Json::Value e; e["error"] = "Internal server error"; send(e, k500InternalServerError); }
    }
};
