#include "LiveEventsController.h"

std::unordered_set<WebSocketConnectionPtr> LiveEventsController::clients;

void LiveEventsController::handleNewConnection(
    const HttpRequestPtr&,
    const WebSocketConnectionPtr& conn) {
    clients.insert(conn);
}

void LiveEventsController::handleConnectionClosed(
    const WebSocketConnectionPtr& conn) {
    clients.erase(conn);
}

void LiveEventsController::handleNewMessage(
    const WebSocketConnectionPtr& conn,
    std::string&& msg,
    const WebSocketMessageType&) {
    conn->send("Connected to AeroBase live stream");
}