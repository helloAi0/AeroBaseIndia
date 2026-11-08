#include <drogon/WebSocketController.h>
#include <set>
#include <memory>
#include <string>
#include <iostream>

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

    /**
     * 1. Secure the Connection
     * Attaches the tenant_id to the socket so we know who this client is.
     */
    void handleNewConnection(const HttpRequestPtr& req,
                             const WebSocketConnectionPtr& conn) override {
        // Extract tenant_id from query parameter (e.g., /ws/flights?tenant_id=xyz)
        // In production, you'd likely verify a JWT here instead.
        std::string tenantId = req->getParameter("tenant_id");

        if (tenantId.empty()) {
            conn->forceClose(); // Reject anonymous connections
            return;
        }

        // Store tenant ID in the connection's "context" as a shared_ptr<string>
        conn->setContext(std::make_shared<std::string>(tenantId));
        clients.insert(conn);
    }

    void handleConnectionClosed(const WebSocketConnectionPtr& conn) override {
        clients.erase(conn);
    }

    /**
     * 2. Targeted Broadcast
     * Only sends the message if the client's tenant matches the event's tenant.
     */
    static void broadcast(const std::string& eventTenantId, const std::string& message) {
        for (auto& client : clients) {
            // Use Drogon's typed context accessor which returns a shared_ptr<std::string>
            auto ctx = client->getContext<std::string>();
            if (!ctx) continue;
            std::string tenantId = *ctx;
            if (tenantId.empty()) continue;

            if (tenantId == eventTenantId) {
                client->send(message);
            }
        }
    }
};

std::set<WebSocketConnectionPtr> FlightSocketController::clients;
