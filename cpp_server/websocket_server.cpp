#include <ixwebsocket/IXWebSocketServer.h>
#include <unordered_map>
#include <mutex>
#include <thread>
#include <chrono>
#include <string>
#include <cstdint>

int main()
{
    ix::WebSocketServer server(8080);

    std::unordered_map<uintptr_t, ix::WebSocket *> clients;
    std::mutex clientsMutex;

    server.setOnClientMessageCallback([&clients, &clientsMutex](
                                          std::shared_ptr<ix::ConnectionState> connectionState, ix::WebSocket &webSocket, const ix::WebSocketMessagePtr &msg)
                                      {

            uintptr_t connectionId = reinterpret_cast<uintptr_t>(&webSocket);
            {
                std::lock_guard<std::mutex> lock(clientsMutex);
                clients[connectionId] = &webSocket;
            }

            webSocket.setOnMessageCallback([&connectionId, &clients, &clientsMutex](const ix::WebSocketMessagePtr& msg) {
                // unused  if (msg->type == ix::WebSocketMessageType::Message) { }
                if (msg->type == ix::WebSocketMessageType::Close) {
                    std::lock_guard<std::mutex> lock(clientsMutex);
                    clients.erase(connectionId);
                }
            }); });

    server.listen();
    server.start();

    auto broadcastMessage = [&clients, &clientsMutex](const std::string &message)
    {
        std::lock_guard<std::mutex> lock(clientsMutex);
        for (auto &pair : clients)
        {
            pair.second->send(message);
        }
    };

    while (true)
    {
        broadcastMessage("Hello from server!");
        std::this_thread::sleep_for(std::chrono::milliseconds(300));
    }

    server.stop();
    return 0;
}
