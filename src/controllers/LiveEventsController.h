#pragma once
#include <drogon/WebSocketController.h>
#include <unordered_set>

using namespace drogon;

class LiveEventsController : public WebSocketController<LiveEventsController> {
public:
    WS_PATH_LIST_BEGIN
        WS_PATH_ADD("/ws/events");
    WS_PATH_LIST_END

    void handleNewMessage(const WebSocketConnectionPtr&,
                          std::string&&,
                          const WebSocketMessageType&) override;

    void handleNewConnection(const HttpRequestPtr&,
                             const WebSocketConnectionPtr&) override;

    void handleConnectionClosed(const WebSocketConnectionPtr&) override;

private:
    static std::unordered_set<WebSocketConnectionPtr> clients;
};