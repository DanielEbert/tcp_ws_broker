// test-server.js
// Run with: node test-server.js

const { test } = require('node:test');
const assert = require('node:assert');
const WebSocket = require('ws');
const http = require('node:http');
const { setTimeout } = require('node:timers/promises');

// Function to make HTTP requests instead of using fetch
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    }).on('error', reject);
  });
}

test('Fastify WebSocket server', async (t) => {
  // Test WebSocket connection
  await t.test('WebSocket client can connect', async () => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    const connected = new Promise(resolve => {
      ws.on('open', () => {
        assert.equal(ws.readyState, WebSocket.OPEN);
        resolve();
      });
    });
    
    await connected;
    return ws;
  });

  // Test REST endpoint
  await t.test('REST API sends message to WebSocket client', async () => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    

    // while(1) {}

    const messageReceived = new Promise(resolve => {
      ws.on('open', async () => {
        const testMessage = 'Test message ' + Date.now();
        const response = await makeRequest(`http://localhost:3000/api/message?text=${encodeURIComponent(testMessage)}`);
        assert.equal(response.status, 200, 'REST API call successful');
      });
      
      ws.on('message', data => {
        const message = JSON.parse(data.toString());
        assert.ok(message.message, 'Message has content');
        resolve(message);
      });
    });
    
    const message = await messageReceived;
    assert.ok(message.timestamp, 'Message has timestamp');
    
    ws.close();
  });

  // Test multiple clients
  await t.test('Message broadcasts to multiple WebSocket clients', async () => {
    // Connect two WebSocket clients
    const ws1 = new WebSocket('ws://localhost:3000/ws');
    const ws2 = new WebSocket('ws://localhost:3000/ws');
    
    // Wait for both to connect
    await Promise.all([
      new Promise(resolve => ws1.on('open', resolve)),
      new Promise(resolve => ws2.on('open', resolve))
    ]);
    
    // Track messages received
    let messagesReceived = 0;
    const testMessage = 'Broadcast test ' + Date.now();
    
    // Set up message handlers
    const allMessagesReceived = Promise.all([
      new Promise(resolve => {
        ws1.on('message', data => {
          const message = JSON.parse(data.toString());
          assert.equal(message.message, testMessage);
          messagesReceived++;
          resolve();
        });
      }),
      new Promise(resolve => {
        ws2.on('message', data => {
          const message = JSON.parse(data.toString());
          assert.equal(message.message, testMessage);
          messagesReceived++;
          resolve();
        });
      })
    ]);
    
    // Make the REST API call
    await makeRequest(`http://localhost:3000/api/message?text=${encodeURIComponent(testMessage)}`);
    
    // Wait for both clients to receive the message
    await allMessagesReceived;
    
    assert.equal(messagesReceived, 2, 'Both clients received the message');
    
    // Clean up
    ws1.close();
    ws2.close();
  });

});