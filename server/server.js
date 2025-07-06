//const { GoogleGenerativeAI } = require('@google/generative-ai');
//const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { generateGeminiSuggestions } = require('./geminiService');

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
    const { selectedText } = req.body; // Expect 'selectedText' from the canvas frontend

    // Validate input
    if (!selectedText || selectedText.trim() === '') {
      return res.json({ suggestions: [] }); // Return empty array if no text is provided
    }

    // Call the modularized Gemini suggestion function
    const geminiSuggestions = await generateGeminiSuggestions(selectedText);
    res.json({ suggestions: geminiSuggestions }); // Send suggestions back to the client

  } catch (error) {
    console.error('Error in /api/ai-suggestions endpoint:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});


// app.post('/api/ai-suggestions', async (req, res) => {
//   try {
//     const { text } = req.body;

//     if (!text || text.trim() === '') {
//       return res.json({ suggestions: [] });
//     }

//     // Demo suggestions
//     const suggestions = [
//       `${text} - improved`,
//       `Better: ${text}`,
//       `✨ ${text} ✨`,
//       `${text.toUpperCase()}`
//     ];

//     res.json({ suggestions });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to generate suggestions' });
//   }
// });

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
  console.log(`Canvas app frontend is expected to be at http://localhost:3002`);
});
