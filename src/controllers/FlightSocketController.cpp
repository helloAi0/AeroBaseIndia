#include <drogon/WebSocketController.h>
#include <set>
#include <memory>
#include <any>

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

        // Store tenant ID in the connection's "context"
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
            try {
                // Retrieve the stored tenant ID
                auto tenantPtr = std::any_cast<std::shared_ptr<std::string>>(client->getContext());
                
                if (tenantPtr && *tenantPtr == eventTenantId) {
                    client->send(message);
                }
            } catch (const std::bad_any_cast&) {
                // Ignore connections without a valid tenant context
                continue;
            }
        }
    }
};

std::set<WebSocketConnectionPtr> FlightSocketController::clients;