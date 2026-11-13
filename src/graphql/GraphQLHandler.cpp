#include "GraphQLHandler.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include "../services/JwtService.h"
#include "../tracing/TraceContext.h"
#include "../metrics/MetricsRegistry.h"
#include <pqxx/pqxx>
#include <regex>
#include <sstream>
#include <unordered_set>

using namespace drogon;

std::unordered_map<std::string, Resolver>& GraphQLHandler::resolvers() {
    static std::unordered_map<std::string, Resolver> r = {
        {"flights",        resolveFlights},
        {"flightById",     resolveFlightById},
        {"tenantInfo",     resolveTenantInfo},
        {"healthStatus",   resolveHealthStatus},
        {"revenueMetrics", resolveRevenueMetrics},
    };
    return r;
}

void GraphQLHandler::handle(const HttpRequestPtr& req,
                             std::function<void(const HttpResponsePtr&)>&& callback) {

    // ── Tracing + Metrics ─────────────────────────────────────────────────────
    Span span = Tracer::getInstance().startSpan("POST /graphql",
        req->getHeader("X-Trace-ID"));
    span.tenantId = req->getHeader("X-Tenant-ID");
    Tracer::addTag(span, "http.path", "/graphql");
    MetricsRegistry::getInstance().incrementCounter(
        "aerobase_http_requests_total",
        "{path=\"/graphql\",method=\"POST\",status=\"200\"}");

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (req->method() == Options) {
        auto resp = HttpResponse::newHttpResponse();
        resp->addHeader("Access-Control-Allow-Origin",  "*");
        resp->addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers",
                        "Content-Type, Authorization, X-Tenant-ID");
        resp->setStatusCode(k200OK);
        Tracer::getInstance().finishSpan(span, 200);
        callback(resp);
        return;
    }

    auto body = req->getJsonObject();
    if (!body || !body->isMember("query")) {
        Json::Value err;
        err["errors"][0]["message"] = "Missing 'query' field";
        auto resp = HttpResponse::newHttpJsonResponse(err);
        resp->setStatusCode(k400BadRequest);
        Tracer::getInstance().finishSpan(span, 400);
        callback(resp);
        return;
    }

    std::string  query     = (*body)["query"].asString();
    Json::Value  variables = body->isMember("variables")
                             ? (*body)["variables"]
                             : Json::Value(Json::objectValue);

    variables.removeMember("tenantId");   // never trust a client-supplied tenant; it is set from the verified JWT below
    std::string auth = req->getHeader("Authorization");
    if (auth.size() > 7) {
        try {
            auto decoded = JwtService::verifyToken(auth.substr(7));
            variables["_role"]     = decoded.get_payload_claim("role").as_string();
            variables["_userId"]   = decoded.get_payload_claim("user_id").as_string();
            variables["_tenantId"] = decoded.get_payload_claim("tenant_id").as_string();
            variables["tenantId"]  = variables["_tenantId"];
        } catch (...) {}
    }

    core::Logger::info("[GraphQL] Query: " + query.substr(0, 80));

    Json::Value result = executeQuery(query, variables);
    auto resp = HttpResponse::newHttpJsonResponse(result);
    resp->addHeader("Access-Control-Allow-Origin", "*");
    Tracer::getInstance().finishSpan(span, 200);
    callback(resp);
}

void GraphQLHandler::schema(const HttpRequestPtr&,
                             std::function<void(const HttpResponsePtr&)>&& callback) {
    Json::Value s;
    s["queries"]["flights"]         = "Get all flights. Args: tenantId";
    s["queries"]["flightById"]      = "Get flight by ID. Args: id";
    s["queries"]["tenantInfo"]      = "Get tenant info. Args: tenantId";
    s["queries"]["healthStatus"]    = "Get system health";
    s["queries"]["revenueMetrics"]  = "Get revenue. Args: tenantId";
    s["version"] = "1.0";
    callback(HttpResponse::newHttpJsonResponse(s));
}

Json::Value GraphQLHandler::executeQuery(
    const std::string& query,
    const Json::Value& variables)
{
    Json::Value response;
    Json::Value data(Json::objectValue);
    Json::Value errors(Json::arrayValue);

    auto& reg = resolvers();
    bool resolved = false;

    std::string token;
    std::istringstream iss(query);

    static const std::unordered_set<std::string> keywords =
    {
        "query", "mutation", "fragment", "on", "subscription"
    };

    while (iss >> token)
    {
        while (!token.empty() &&
              (token.front() == '{' || token.front() == '('))
            token.erase(token.begin());

        while (!token.empty() &&
              (token.back() == '}' ||
               token.back() == '{' ||
               token.back() == ')' ||
               token.back() == '('))
            token.pop_back();

        if (token.empty() || keywords.count(token))
            continue;

        if (reg.count(token))
        {
            try
            {
                data[token] = reg[token](variables);
                resolved = true;
            }
            catch (const std::exception& e)
            {
                Json::Value err;
                err["message"] = e.what();
                err["path"] = token;
                errors.append(err);
            }
        }
    }

    if (!resolved && errors.empty())
    {
        Json::Value err;
        err["message"] = "No recognized query found";
        errors.append(err);
    }

    response["data"] = data;
    if (!errors.empty())
        response["errors"] = errors;

    return response;
}

// ─────────────────────────────────────────────────────────────
// Built-in resolvers
// ─────────────────────────────────────────────────────────────
static std::string tenantOf(const Json::Value& vars) {
    const std::string t = vars.get("tenantId", "").asString();
    if (t.size() != 36) throw std::runtime_error("Authentication required");
    return t;
}

Json::Value GraphQLHandler::resolveFlights(const Json::Value& vars)
{
    auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
    auto rows = t.exec_params("SELECT id::text, flight_number, origin, destination, status, COALESCE(gate,''), to_char(departure_time,'YYYY-MM-DD\"T\"HH24:MI') "
                              "FROM flights WHERE tenant_id=$1::uuid ORDER BY departure_time LIMIT 200", tenantOf(vars));
    Json::Value out(Json::arrayValue);
    for (const auto& r : rows) { Json::Value f; f["id"] = r[0].c_str(); f["flightNumber"] = r[1].c_str(); f["origin"] = r[2].c_str(); f["destination"] = r[3].c_str(); f["status"] = r[4].c_str(); f["gate"] = r[5].c_str(); f["departure"] = r[6].c_str(); out.append(f); }
    return out;
}

Json::Value GraphQLHandler::resolveFlightById(const Json::Value& vars)
{
    const std::string id = vars.get("id", "").asString();
    static const std::regex uuid("^[0-9a-fA-F-]{36}$");
    if (!std::regex_match(id, uuid)) throw std::runtime_error("Invalid flight id");
    auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
    auto rows = t.exec_params("SELECT id::text, flight_number, origin, destination, status, COALESCE(gate,''), to_char(departure_time,'YYYY-MM-DD\"T\"HH24:MI') FROM flights WHERE id=$1::uuid AND tenant_id=$2::uuid", id, tenantOf(vars));
    if (rows.empty()) return Json::Value();
    const auto& r = rows[0]; Json::Value f; f["id"] = r[0].c_str(); f["flightNumber"] = r[1].c_str(); f["origin"] = r[2].c_str(); f["destination"] = r[3].c_str(); f["status"] = r[4].c_str(); f["gate"] = r[5].c_str(); f["departure"] = r[6].c_str();
    return f;
}

Json::Value GraphQLHandler::resolveTenantInfo(const Json::Value& vars)
{
    auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
    auto rows = t.exec_params("SELECT id::text, airport_name, airport_code, subscription_plan FROM tenants WHERE id=$1::uuid", tenantOf(vars));
    if (rows.empty()) throw std::runtime_error("Tenant not found");
    Json::Value tenant; tenant["tenantId"] = rows[0][0].c_str(); tenant["name"] = rows[0][1].c_str(); tenant["code"] = rows[0][2].c_str(); tenant["plan"] = rows[0][3].c_str();
    return tenant;
}

Json::Value GraphQLHandler::resolveHealthStatus(const Json::Value&)
{
    Json::Value health; health["status"] = "healthy"; health["database"] = "down";
    try { auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn); t.exec("SELECT 1"); health["database"] = "connected"; }
    catch (...) { health["status"] = "degraded"; }
    return health;
}

Json::Value GraphQLHandler::resolveRevenueMetrics(const Json::Value& vars)
{
    auto conn = DatabaseManager::getConnection(); pqxx::read_transaction t(*conn);
    const std::string tid = tenantOf(vars);
    auto paid = t.exec_params("SELECT COALESCE(SUM(amount),0)::float8, COUNT(*) FROM payment_orders WHERE tenant_id=$1 AND status='PAID'", tid);
    auto bids = t.exec_params("SELECT COALESCE(SUM((data->>'amount')::numeric),0)::float8 FROM app_records WHERE tenant_id=$1::uuid AND collection='bids' AND data->>'status'='Accepted' AND (data->>'amount') ~ '^[0-9.]+$'", tid);
    Json::Value revenue; revenue["currency"] = "INR"; revenue["paidOrders"] = paid[0][1].as<int>(); revenue["collected"] = paid[0][0].as<double>();
    revenue["acceptedBids"] = bids[0][0].as<double>(); revenue["commission"] = bids[0][0].as<double>() * 0.12;
    return revenue;
}
