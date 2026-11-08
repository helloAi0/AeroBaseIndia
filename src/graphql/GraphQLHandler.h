#pragma once
#include "../gateway/ApiGateway.h"

#include <drogon/HttpController.h>
#include <json/json.h>
#include <string>
#include <unordered_map>
#include <functional>

// Resolver function type
using Resolver = std::function<Json::Value(const Json::Value&)>;

class GraphQLHandler : public drogon::HttpController<GraphQLHandler>
{
public:
    METHOD_LIST_BEGIN
        ADD_METHOD_TO(GraphQLHandler::handle, "/graphql", drogon::Post, drogon::Options);
        ADD_METHOD_TO(GraphQLHandler::schema, "/graphql/schema", drogon::Get);
    METHOD_LIST_END

    void handle(
        const drogon::HttpRequestPtr& req,
        std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    void schema(
        const drogon::HttpRequestPtr& req,
        std::function<void(const drogon::HttpResponsePtr&)>&& callback);

    static void registerResolver(
        const std::string& field,
        Resolver resolver);

private:
    static Json::Value executeQuery(
        const std::string& query,
        const Json::Value& variables);

    static Json::Value resolveFlights(const Json::Value& vars);
    static Json::Value resolveFlightById(const Json::Value& vars);
    static Json::Value resolveTenantInfo(const Json::Value& vars);
    static Json::Value resolveHealthStatus(const Json::Value& vars);
    static Json::Value resolveRevenueMetrics(const Json::Value& vars);

    static std::unordered_map<std::string, Resolver>& resolvers();
};