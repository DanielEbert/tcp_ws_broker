cmake_minimum_required(VERSION 3.10)
project(WebSocketServer)

set(CMAKE_CXX_STANDARD 14)

find_package(ixwebsocket REQUIRED)

add_executable(websocket_server websocket_server.cpp)
target_link_libraries(websocket_server PRIVATE ixwebsocket::ixwebsocket)
