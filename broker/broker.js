const net = require('net');
const WebSocket = require('ws');

const tcpPort = 8888;
const wsPort = 7001;

const wss = new WebSocket.Server({ port: wsPort });
const clients = new Set();

wss.on('connection', ws => {
    console.log('WebSocket Client connected.');
    clients.add(ws);
    ws.on('close', () => {
        console.log('WebSocket Client disconnected.');
        clients.delete(ws)
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        clients.delete(ws);
    });
});

net.createServer(socket => {
    let buffer = Buffer.alloc(0);

    socket.on('data', data => {
        buffer = Buffer.concat([buffer, data]);

        while (buffer.length >= 4) {
            const messageLength = buffer.readUInt32BE(0);

            if (buffer.length >= 4 + messageLength) {
                const message = buffer.slice(4, 4 + messageLength);
                clients.forEach(client => client.readyState === WebSocket.OPEN && client.send(message));
                buffer = buffer.slice(4 + messageLength);
            } else {
                break;
            }
        }
    });

    socket.on('error', err => console.error('TCP socket error:', err.message));
    socket.on('close', () => buffer = null);

}).listen(tcpPort, () => console.log(`TCP server listening on port ${tcpPort}`));

process.on('SIGINT', () => {
    console.log('Received SIGINT.  Closing connections and server.');
    clients.forEach(client => client.close());
    wss.close();
    tcpServer.close();
    process.exit(0);
});

console.log(`TCP server listening on port ${tcpPort}`);
console.log(`WebSocket server listening on port ${wsPort}`);
