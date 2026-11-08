#pragma once
#include <drogon/WebSocketController.h>
#include <set>
#include <mutex>

using namespace drogon;

class TwinWebSocket : public drogon::WebSocketController<TwinWebSocket>
{
public:
    // Standard Drogon WebSocket methods
    void handleNewMessage(const WebSocketConnectionPtr&, std::string&&, const WebSocketMessageType&) override;
    void handleNewConnection(const HttpRequestPtr&, const WebSocketConnectionPtr&) override;
    void handleConnectionClosed(const WebSocketConnectionPtr&) override;

    // The logic to push data to all connected browsers
    static void broadcastUpdate(const std::string& message);

    WS_PATH_LIST_BEGIN
    // The path the frontend will connect to: ws://server:port/realtime/twin
    WS_PATH_ADD("/realtime/twin");
    WS_PATH_LIST_END

private:
    // Thread-safe set of active connections
    static std::set<WebSocketConnectionPtr> connections_;
    static std::mutex connections_mutex_;
};