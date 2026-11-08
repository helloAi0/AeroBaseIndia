#include "GraphQLHandler.h"
#include "../config/DatabaseManager.h"
#include "../core/Logger.h"
#include "../services/JwtService.h"
#include "../tracing/TraceContext.h"
#include "../metrics/MetricsRegistry.h"
#include <pqxx/pqxx>
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

    std::string tenantId = req->getHeader("X-Tenant-ID");
    if (!tenantId.empty()) variables["tenantId"] = tenantId;

    std::string auth = req->getHeader("Authorization");
    if (auth.size() > 7) {
        try {
            auto decoded = JwtService::verifyToken(auth.substr(7));
            variables["_role"]     = decoded.get_payload_claim("role").as_string();
            variables["_userId"]   = decoded.get_payload_claim("user_id").as_string();
            variables["_tenantId"] = decoded.get_payload_claim("tenant_id").as_string();
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
Json::Value GraphQLHandler::resolveFlights(const Json::Value&)
{
    Json::Value flights(Json::arrayValue);

    Json::Value f1;
    f1["flightNumber"] = "AI101";
    f1["status"] = "Boarding";

    Json::Value f2;
    f2["flightNumber"] = "AI202";
    f2["status"] = "Delayed";

    flights.append(f1);
    flights.append(f2);

    return flights;
}

Json::Value GraphQLHandler::resolveFlightById(const Json::Value& vars)
{
    Json::Value flight;
    flight["id"] = vars.get("id", "1").asString();
    flight["flightNumber"] = "AI101";
    flight["status"] = "Scheduled";
    return flight;
}

Json::Value GraphQLHandler::resolveTenantInfo(const Json::Value& vars)
{
    Json::Value tenant;
    tenant["tenantId"] = vars.get("tenantId", "UNKNOWN").asString();
    tenant["name"] = "AeroBase India";
    tenant["region"] = "India";
    return tenant;
}

Json::Value GraphQLHandler::resolveHealthStatus(const Json::Value&)
{
    Json::Value health;
    health["status"] = "healthy";
    health["database"] = "connected";
    health["redis"] = "connected";
    return health;
}

Json::Value GraphQLHandler::resolveRevenueMetrics(const Json::Value&)
{
    Json::Value revenue;
    revenue["monthly"] = 125000;
    revenue["currency"] = "INR";
    return revenue;
}