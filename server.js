 const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('chat message', ({ name, message }) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    io.emit('chat message', { name, message, timestamp });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

if (!process.env.PORT) {
  console.error('❌ Error: PORT environment variable is not set.');
  process.exit(1);
}

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
