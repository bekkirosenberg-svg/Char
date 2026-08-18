const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 1e7 // 10MB limit for image and audio payloads
});

// Serve static frontend files
app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle incoming chat payload (text, image base64, or audio base64)
  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      sender: socket.id,
      text: data.text || null,
      image: data.image || null,
      audio: data.audio || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

