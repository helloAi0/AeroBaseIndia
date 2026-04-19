#include <drogon/WebSocketController.h>
#include <set>

using namespace drogon;

class FlightSocketController : public WebSocketController<FlightSocketController> {
public:
    WS_PATH_LIST_BEGIN
        WS_PATH_ADD("/ws/flights");
    WS_PATH_LIST_END

    static std::set<WebSocketConnectionPtr> clients;

    void handleNewMessage(const WebSocketConnectionPtr&,
                          std::string&&,
                          const WebSocketMessageType&) override {}

    void handleNewConnection(const HttpRequestPtr&,
                             const WebSocketConnectionPtr& conn) override {
        clients.insert(conn);
    }

    void handleConnectionClosed(const WebSocketConnectionPtr& conn) override {
        clients.erase(conn);
    }

    static void broadcast(const std::string& message) {
        for (auto& client : clients) {
            client->send(message);
        }
    }
};

std::set<WebSocketConnectionPtr> FlightSocketController::clients;