#include <ixwebsocket/IXWebSocketServer.h>

int main()
{
    ix::WebSocketServer server(8080);

    std::set<std::shared_ptr<ix::WebSocket>> clients;
    std::mutex clientsMutex;

    server.setOnConnectionCallback([&clients, &clientsMutex](std::weak_ptr<ix::WebSocket> weakWebSocket,
                                                             std::shared_ptr<ix::ConnectionState> connectionState)
                                   {
        if (auto webSocket = weakWebSocket.lock()) {
            webSocket->setOnMessageCallback([](const ix::WebSocketMessagePtr& msg) {
                if (msg->type == ix::WebSocketMessageType::Message) {
                    // Handle incoming messages if needed
                }
            });

            std::lock_guard<std::mutex> lock(clientsMutex);
            clients.insert(webSocket); 
        } });

    server.listen();
    server.start();

    auto broadcastMessage = [&clients, &clientsMutex](const std::string &message)
    {
        std::lock_guard<std::mutex> lock(clientsMutex);
        for (auto &client : clients)
        {
            client->send(message);
        }
    };

    while (true)
    {
        broadcastMessage("Hello from server!");
        std::this_thread::sleep_for(std::chrono::microseconds(1));
    }

    server.stop();
    return 0;
}
