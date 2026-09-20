import express from 'express';
import expressWs from 'express-ws';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';

const port = process.env.PORT || 3001;

// Database connection
connectDB();

// Setup WebSocket
const server = http.createServer(app);
const wsInstance = expressWs(app, server);

// Minimalistic WebSocket implementation for real-time tremor & gait
app.ws('/ws/tremor', (ws, req) => {
  console.log('Tremor viewer connected');
  ws.on('message', (msg) => {
    // Process messages if needed (e.g. identify device)
    console.log(`Tremor Msg: ${msg.slice(0, 50)}...`);
  });
  ws.on('close', () => console.log('Tremor viewer disconnected'));
});

// Broadcast to viewers logic (in-memory simple broadcaster)
global.broadcastToTremorViewers = (data) => {
  const wsServer = wsInstance.getWss('/ws/tremor');
  wsServer.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
