#include "NotificationController.h"
#include "../notifications/EmailService.h"
#include "../middleware/AdminAuth.h"
#include "../middleware/JwtIdentity.h"
#include <json/json.h>

using namespace drogon;

void NotificationController::sendEmail(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    { HttpResponsePtr bad; if (!adminauth::require(req, bad)) { cb(bad); return; } }
    auto json = req->getJsonObject();
    if (!json) {
        Json::Value e; e["error"] = "Invalid JSON";
        auto r = HttpResponse::newHttpJsonResponse(e);
        r->setStatusCode(k400BadRequest);
        cb(r); return;
    }
    EmailPayload p;
    p.to       = (*json).get("to",       "").asString();
    p.subject  = (*json).get("subject",  "AeroBase Notification").asString();
    p.body     = (*json).get("body",     "").asString();
    p.type     = (*json).get("type",     "GENERAL").asString();
    { jwtid::Identity id; jwtid::identify(req, id); p.tenantId = id.tenant; }

    if (p.to.empty()) {
        Json::Value e; e["error"] = "Missing 'to' field";
        auto r = HttpResponse::newHttpJsonResponse(e);
        r->setStatusCode(k400BadRequest);
        cb(r); return;
    }

    bool ok = EmailService::send(p);
    Json::Value res;
    res["status"]  = ok ? "queued" : "failed";
    res["to"]      = p.to;
    res["type"]    = p.type;
    res["message"] = "Email logged and queued for delivery";
    cb(HttpResponse::newHttpJsonResponse(res));
}

void NotificationController::getQueue(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    { HttpResponsePtr bad; if (!adminauth::require(req, bad)) { cb(bad); return; } }
    auto queue = EmailService::getQueue();
    Json::Value arr(Json::arrayValue);
    for (auto& e : queue) {
        Json::Value item;
        item["to"]       = e.to;
        item["subject"]  = e.subject;
        item["type"]     = e.type;
        item["tenantId"] = e.tenantId;
        arr.append(item);
    }
    Json::Value res;
    res["count"]  = (int)queue.size();
    res["emails"] = arr;
    cb(HttpResponse::newHttpJsonResponse(res));
}

void NotificationController::testDelay(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    { HttpResponsePtr bad; if (!adminauth::require(req, bad)) { cb(bad); return; } }
    auto json = req->getJsonObject();
    std::string to     = json ? (*json).get("to","test@aerobase.in").asString() : "test@aerobase.in";
    std::string flight = json ? (*json).get("flight","AI-202").asString() : "AI-202";
    int         delay  = json ? (*json).get("delay_mins",45).asInt() : 45;
    std::string tenant; { jwtid::Identity id; jwtid::identify(req, id); tenant = id.tenant; }

    EmailService::sendDelayAlert(to, flight, delay, tenant);

    Json::Value res;
    res["status"]  = "sent";
    res["to"]      = to;
    res["flight"]  = flight;
    res["delay"]   = delay;
    cb(HttpResponse::newHttpJsonResponse(res));
}

void NotificationController::testBilling(
    const HttpRequestPtr& req,
    std::function<void(const HttpResponsePtr&)>&& cb)
{
    { HttpResponsePtr bad; if (!adminauth::require(req, bad)) { cb(bad); return; } }
    auto json      = req->getJsonObject();
    std::string to = json ? (*json).get("to","billing@aerobase.in").asString()
                          : "billing@aerobase.in";
    std::string id = json ? (*json).get("invoice_id","INV-001").asString() : "INV-001";
    double    amt  = json ? (*json).get("amount",49999.0).asDouble() : 49999.0;
    std::string tenant; { jwtid::Identity id; jwtid::identify(req, id); tenant = id.tenant; }

    EmailService::sendBillingInvoice(to, id, amt, tenant);

    Json::Value res;
    res["status"]     = "sent";
    res["to"]         = to;
    res["invoice_id"] = id;
    res["amount"]     = amt;
    cb(HttpResponse::newHttpJsonResponse(res));
}
