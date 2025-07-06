const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000","http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store last full canvas state
let canvasState = null;

// --- AI Suggestions API ---
app.post('/api/ai-suggestions', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.json({ suggestions: [] });
    }

    // Demo suggestions
    const suggestions = [
      `${text} - improved`,
      `Better: ${text}`,
      `✨ ${text} ✨`,
      `${text.toUpperCase()}`
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// --- Socket.IO logic ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send last known state
  if (canvasState) {
    socket.emit('canvas-update', canvasState);
  }

  socket.on('canvas-update', (data) => {
    canvasState = data;
    socket.broadcast.emit('canvas-update', data);
  });

  socket.on('canvas-clear', () => {
    canvasState = null;
    io.emit('canvas-clear'); // broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
