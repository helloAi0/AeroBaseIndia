#include "TwinWebSocket.h"
#include "../core/Logger.h"

// Initialize static members
std::set<WebSocketConnectionPtr> TwinWebSocket::connections_;
std::mutex TwinWebSocket::connections_mutex_;

void TwinWebSocket::handleNewConnection(const HttpRequestPtr& req, const WebSocketConnectionPtr& conn) {
    std::lock_guard<std::mutex> lock(connections_mutex_);
    connections_.insert(conn);
    Logger::info("New Twin Dashboard connected. Total subscribers: " + std::to_string(connections_.size()));
}

void TwinWebSocket::handleConnectionClosed(const WebSocketConnectionPtr& conn) {
    std::lock_guard<std::mutex> lock(connections_mutex_);
    connections_.erase(conn);
    Logger::info("Twin Dashboard disconnected. Remaining subscribers: " + std::to_string(connections_.size()));
}

void TwinWebSocket::handleNewMessage(const WebSocketConnectionPtr& conn, std::string&& message, const WebSocketMessageType& type) {
    // Usually, the dashboard only receives data. 
    // But if they send "PING", we can send "PONG" to keep the connection alive.
    if (message == "PING") {
        conn->send("PONG");
    }
}

void TwinWebSocket::broadcastUpdate(const std::string& message) {
    std::lock_guard<std::mutex> lock(connections_mutex_);
    for (auto const& conn : connections_) {
        if (conn->connected()) {
            conn->send(message);
        }
    }
}