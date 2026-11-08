#include "SwaggerController.h"
#include <json/json.h>
#include <sstream>

using namespace drogon;

// ── Build OpenAPI 3.0 JSON spec ───────────────────────────────────────────────
static Json::Value buildSpec() {
    Json::Value spec;

    // ── Info ──────────────────────────────────────────────────────────────────
    spec["openapi"] = "3.0.0";
    spec["info"]["title"]       = "AeroBase India API";
    spec["info"]["version"]     = "1.0.0";
    spec["info"]["description"] = "Multi-tenant Airport Management SaaS Platform";
    spec["info"]["contact"]["name"]  = "AeroBase India";
    spec["info"]["contact"]["email"] = "api@aerobase.in";

    spec["servers"][0]["url"]         = "http://localhost:8080";
    spec["servers"][0]["description"] = "Local Development";
    spec["servers"][1]["url"]         = "https://api.aerobase.in";
    spec["servers"][1]["description"] = "Production";

    // ── Security schemes ──────────────────────────────────────────────────────
    spec["components"]["securitySchemes"]["BearerAuth"]["type"]         = "http";
    spec["components"]["securitySchemes"]["BearerAuth"]["scheme"]       = "bearer";
    spec["components"]["securitySchemes"]["BearerAuth"]["bearerFormat"] = "JWT";
    spec["components"]["securitySchemes"]["TenantID"]["type"] = "apiKey";
    spec["components"]["securitySchemes"]["TenantID"]["in"]   = "header";
    spec["components"]["securitySchemes"]["TenantID"]["name"] = "X-Tenant-ID";

    // ── Reusable schemas ──────────────────────────────────────────────────────
    auto& schemas = spec["components"]["schemas"];

    schemas["Flight"]["type"] = "object";
    schemas["Flight"]["properties"]["id"]["type"]            = "string";
    schemas["Flight"]["properties"]["flightNumber"]["type"]  = "string";
    schemas["Flight"]["properties"]["origin"]["type"]        = "string";
    schemas["Flight"]["properties"]["destination"]["type"]   = "string";
    schemas["Flight"]["properties"]["status"]["type"]        = "string";
    schemas["Flight"]["properties"]["gate"]["type"]          = "string";
    schemas["Flight"]["properties"]["predictedDelay"]["type"]= "integer";

    schemas["PaymentOrder"]["type"] = "object";
    schemas["PaymentOrder"]["properties"]["orderId"]["type"]      = "string";
    schemas["PaymentOrder"]["properties"]["invoiceId"]["type"]    = "string";
    schemas["PaymentOrder"]["properties"]["amount"]["type"]       = "number";
    schemas["PaymentOrder"]["properties"]["currency"]["type"]     = "string";
    schemas["PaymentOrder"]["properties"]["status"]["type"]       = "string";
    schemas["PaymentOrder"]["properties"]["checkoutUrl"]["type"]  = "string";
    schemas["PaymentOrder"]["properties"]["gateway"]["type"]      = "string";

    schemas["HealthStatus"]["type"] = "object";
    schemas["HealthStatus"]["properties"]["status"]["type"]   = "string";
    schemas["HealthStatus"]["properties"]["database"]["type"] = "string";
    schemas["HealthStatus"]["properties"]["redis"]["type"]    = "string";

    schemas["Error"]["type"] = "object";
    schemas["Error"]["properties"]["error"]["type"] = "string";
    schemas["Error"]["properties"]["code"]["type"]  = "string";

    auto& paths = spec["paths"];

    // ── GET /health ───────────────────────────────────────────────────────────
    paths["/health"]["get"]["summary"]     = "Health check";
    paths["/health"]["get"]["tags"][0]     = "System";
    paths["/health"]["get"]["operationId"] = "getHealth";
    paths["/health"]["get"]["responses"]["200"]["description"] = "System healthy";
    paths["/health"]["get"]["responses"]["200"]["content"]
        ["application/json"]["schema"]["$ref"] = "#/components/schemas/HealthStatus";
    paths["/health"]["get"]["responses"]["503"]["description"] = "System degraded";

    // ── GET /metrics ──────────────────────────────────────────────────────────
    paths["/metrics"]["get"]["summary"]     = "Prometheus metrics";
    paths["/metrics"]["get"]["tags"][0]     = "System";
    paths["/metrics"]["get"]["operationId"] = "getMetrics";
    paths["/metrics"]["get"]["responses"]["200"]["description"] =
        "Prometheus text format metrics";

    // ── GET /traces ───────────────────────────────────────────────────────────
    paths["/traces"]["get"]["summary"]     = "Get distributed traces";
    paths["/traces"]["get"]["tags"][0]     = "Observability";
    paths["/traces"]["get"]["operationId"] = "getTraces";
    paths["/traces"]["get"]["responses"]["200"]["description"] = "List of spans";

    // ── GET /flights ──────────────────────────────────────────────────────────
    paths["/flights"]["get"]["summary"]     = "List flights for tenant";
    paths["/flights"]["get"]["tags"][0]     = "Flights";
    paths["/flights"]["get"]["operationId"] = "getFlights";
    paths["/flights"]["get"]["security"][0]["BearerAuth"] = Json::Value(Json::arrayValue);
    paths["/flights"]["get"]["security"][0]["TenantID"]   = Json::Value(Json::arrayValue);
    paths["/flights"]["get"]["responses"]["200"]["description"] = "Flight list";
    paths["/flights"]["get"]["responses"]["200"]["content"]
        ["application/json"]["schema"]["type"] = "array";
    paths["/flights"]["get"]["responses"]["200"]["content"]
        ["application/json"]["schema"]["items"]["$ref"] = "#/components/schemas/Flight";

    // ── POST /flights ─────────────────────────────────────────────────────────
    paths["/flights"]["post"]["summary"]     = "Create a new flight";
    paths["/flights"]["post"]["tags"][0]     = "Flights";
    paths["/flights"]["post"]["operationId"] = "createFlight";
    paths["/flights"]["post"]["security"][0]["BearerAuth"] = Json::Value(Json::arrayValue);
    paths["/flights"]["post"]["requestBody"]["required"] = true;
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["type"] = "object";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["required"][0] = "flight_number";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["flight_number"]["type"] = "string";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["origin"]["type"] = "string";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["destination"]["type"] = "string";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["gate"]["type"] = "string";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["weather_score"]["type"] = "number";
    paths["/flights"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["congestion_score"]["type"] = "number";
    paths["/flights"]["post"]["responses"]["200"]["description"] = "Flight created";

    // ── POST /graphql ─────────────────────────────────────────────────────────
    paths["/graphql"]["post"]["summary"]     = "GraphQL endpoint";
    paths["/graphql"]["post"]["tags"][0]     = "GraphQL";
    paths["/graphql"]["post"]["operationId"] = "graphql";
    paths["/graphql"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["type"] = "object";
    paths["/graphql"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["query"]["type"] = "string";
    paths["/graphql"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["query"]["example"] =
        "{ flights { flightNumber status } }";
    paths["/graphql"]["post"]["responses"]["200"]["description"] = "GraphQL response";

    // ── GET /graphql/schema ───────────────────────────────────────────────────
    paths["/graphql/schema"]["get"]["summary"]     = "GraphQL schema";
    paths["/graphql/schema"]["get"]["tags"][0]     = "GraphQL";
    paths["/graphql/schema"]["get"]["operationId"] = "graphqlSchema";
    paths["/graphql/schema"]["get"]["responses"]["200"]["description"] =
        "Available queries";

    // ── POST /predict/delay ───────────────────────────────────────────────────
    paths["/predict/delay"]["post"]["summary"]     = "Predict flight delay";
    paths["/predict/delay"]["post"]["tags"][0]     = "AI/ML";
    paths["/predict/delay"]["post"]["operationId"] = "predictDelay";
    paths["/predict/delay"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["weather_score"]["type"] = "number";
    paths["/predict/delay"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["congestion_score"]["type"] = "number";
    paths["/predict/delay"]["post"]["responses"]["200"]["description"] =
        "Predicted delay in minutes";

    // ── POST /payments/order ──────────────────────────────────────────────────
    paths["/payments/order"]["post"]["summary"]     = "Create payment order";
    paths["/payments/order"]["post"]["tags"][0]     = "Payments";
    paths["/payments/order"]["post"]["operationId"] = "createPaymentOrder";
    paths["/payments/order"]["post"]["security"][0]["BearerAuth"] =
        Json::Value(Json::arrayValue);
    paths["/payments/order"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["invoice_id"]["type"] = "string";
    paths["/payments/order"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["amount"]["type"] = "number";
    paths["/payments/order"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["currency"]["type"] = "string";
    paths["/payments/order"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["gateway"]["type"] = "string";
    paths["/payments/order"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["gateway"]["enum"][0] = "razorpay";
    paths["/payments/order"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["gateway"]["enum"][1] = "stripe";
    paths["/payments/order"]["post"]["responses"]["200"]["description"] =
        "Payment order created with checkout URL";
    paths["/payments/order"]["post"]["responses"]["200"]["content"]
        ["application/json"]["schema"]["$ref"] = "#/components/schemas/PaymentOrder";

    // ── GET /payments/orders ──────────────────────────────────────────────────
    paths["/payments/orders"]["get"]["summary"]     = "List tenant payment orders";
    paths["/payments/orders"]["get"]["tags"][0]     = "Payments";
    paths["/payments/orders"]["get"]["operationId"] = "listPaymentOrders";
    paths["/payments/orders"]["get"]["responses"]["200"]["description"] =
        "List of orders";

    // ── POST /notify/email ────────────────────────────────────────────────────
    paths["/notify/email"]["post"]["summary"]     = "Send email notification";
    paths["/notify/email"]["post"]["tags"][0]     = "Notifications";
    paths["/notify/email"]["post"]["operationId"] = "sendEmail";
    paths["/notify/email"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["to"]["type"] = "string";
    paths["/notify/email"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["subject"]["type"] = "string";
    paths["/notify/email"]["post"]["requestBody"]["content"]
        ["application/json"]["schema"]["properties"]["type"]["type"] = "string";
    paths["/notify/email"]["post"]["responses"]["200"]["description"] = "Email queued";

    // ── GET /notify/queue ─────────────────────────────────────────────────────
    paths["/notify/queue"]["get"]["summary"]     = "View email queue";
    paths["/notify/queue"]["get"]["tags"][0]     = "Notifications";
    paths["/notify/queue"]["get"]["operationId"] = "getEmailQueue";
    paths["/notify/queue"]["get"]["responses"]["200"]["description"] =
        "Email queue contents";

    // ── POST /notify/test/delay ───────────────────────────────────────────────
    paths["/notify/test/delay"]["post"]["summary"]     = "Test delay alert email";
    paths["/notify/test/delay"]["post"]["tags"][0]     = "Notifications";
    paths["/notify/test/delay"]["post"]["operationId"] = "testDelayEmail";
    paths["/notify/test/delay"]["post"]["responses"]["200"]["description"] = "Sent";

    // ── Tags ──────────────────────────────────────────────────────────────────
    spec["tags"][0]["name"] = "System";
    spec["tags"][0]["description"] = "Health, metrics, tracing";
    spec["tags"][1]["name"] = "Flights";
    spec["tags"][1]["description"] = "Flight management";
    spec["tags"][2]["name"] = "GraphQL";
    spec["tags"][2]["description"] = "GraphQL query interface";
    spec["tags"][3]["name"] = "AI/ML";
    spec["tags"][3]["description"] = "Delay prediction and ML";
    spec["tags"][4]["name"] = "Payments";
    spec["tags"][4]["description"] = "Razorpay and Stripe payments";
    spec["tags"][5]["name"] = "Notifications";
    spec["tags"][5]["description"] = "Email notification system";
    spec["tags"][6]["name"] = "Observability";
    spec["tags"][6]["description"] = "Traces and distributed tracing";

    return spec;
}

void SwaggerController::swaggerJson(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    auto resp = HttpResponse::newHttpJsonResponse(buildSpec());
    resp->addHeader("Access-Control-Allow-Origin", "*");
    cb(resp);
}

void SwaggerController::swaggerUi(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    std::string html = R"html(<!DOCTYPE html>
<html>
<head>
  <title>AeroBase India API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css"/>
  <style>
    body { margin: 0; background: #0a0a0a; }
    .topbar { background: #1a1a2e !important; }
    .topbar-wrapper img { display: none; }
    .topbar-wrapper::before {
      content: "✈ AeroBase India API";
      color: white;
      font-size: 1.4em;
      font-weight: bold;
      padding: 10px;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api-docs",
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        req.headers['X-Tenant-ID'] = req.headers['X-Tenant-ID'] || 'DEL';
        return req;
      }
    });
  </script>
</body>
</html>)html";

    auto resp = HttpResponse::newHttpResponse();
    resp->setBody(html);
    resp->setContentTypeString("text/html; charset=utf-8");
    cb(resp);
}

void SwaggerController::redoc(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    std::string html = R"html(<!DOCTYPE html>
<html>
<head>
  <title>AeroBase India — ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{margin:0;padding:0;}</style>
</head>
<body>
  <redoc spec-url="/api-docs"
         expand-responses="200"
         hide-download-button="false"
         theme='{"colors":{"primary":{"main":"#0066cc"}}}'
  ></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js"></script>
</body>
</html>)html";

    auto resp = HttpResponse::newHttpResponse();
    resp->setBody(html);
    resp->setContentTypeString("text/html; charset=utf-8");
    cb(resp);
}
