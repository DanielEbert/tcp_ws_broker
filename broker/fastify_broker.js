import Fastify from 'fastify'
const fastify = Fastify({ logger: true })
const websocketPlugin = require('@fastify/websocket')

fastify.register(websocketPlugin)

const clients = new Set()

fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        clients.add(socket)
        fastify.log.info('Client connected')

        socket.on('close', () => {
            clients.delete(socket)
            fastify.log.info('Client disconnected')
        })

        socket.on('message', (message) => {
            fastify.log.info(`Received message: ${message}`);
        });
    })
})

fastify.get('/api/message', async (request, reply) => {
    const message = request.query.text;
    const response = {
        timestamp: new Date().toISOString(),
        message: message,
        path: request.url
    };

    for (const client of clients) {
        client.send(JSON.stringify(response))
    }

    return response
})

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' })
        console.log('Server running on localhost:3000')
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
