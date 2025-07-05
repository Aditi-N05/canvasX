const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store canvas state
let canvasState = null;

// AI Suggestions endpoint
app.post('/api/ai-suggestions', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.json({ suggestions: [] });
    }

    // For demo purposes, we'll use a simple suggestion system
    // In production, you would integrate with OpenAI API or another AI service
    const suggestions = generateMockSuggestions(text);

    // Uncomment the following section to use OpenAI API
    /*
    const openaiSuggestions = await generateOpenAISuggestions(text);
    res.json({ suggestions: openaiSuggestions });
    */

    res.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Mock AI suggestions for demo (replace with real AI integration)
function generateMockSuggestions(text) {
  const suggestions = [];

  // Simple text enhancement suggestions
  if (text.length < 20) {
    suggestions.push(`${text} - enhanced with details`);
    suggestions.push(`Here's an improved version: ${text}`);
  }

  // Grammar and style suggestions
  if (!text.endsWith('.') && !text.endsWith('!') && !text.endsWith('?')) {
    suggestions.push(`${text}.`);
  }

  // Creative variations
  suggestions.push(`✨ ${text} ✨`);
  suggestions.push(text.toUpperCase());
  suggestions.push(`"${text}"`);

  // Context-aware suggestions based on content
  if (text.toLowerCase().includes('idea')) {
    suggestions.push('💡 Innovative concept that could revolutionize the industry');
    suggestions.push('🎯 Strategic initiative with high potential impact');
  }

  if (text.toLowerCase().includes('project')) {
    suggestions.push('📊 Project milestone with clear deliverables');
    suggestions.push('🚀 High-priority project requiring immediate attention');
  }

  return suggestions.slice(0, 4); // Return max 4 suggestions
}

// OpenAI integration (optional - requires API key)
async function generateOpenAISuggestions(text) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful writing assistant. Provide 3-4 improved versions or suggestions for the given text. Keep suggestions concise and relevant.'
          },
          {
            role: 'user',
            content: `Please provide suggestions to improve this text: "${text}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the AI response to extract individual suggestions
    const suggestions = aiResponse.split('\n').filter(s => s.trim()).slice(0, 4);
    return suggestions;

  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockSuggestions(text); // Fallback to mock suggestions
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current canvas state to new user
  if (canvasState) {
    socket.emit('canvas-update', canvasState);
  }

  // Handle canvas updates
  socket.on('canvas-update', (data) => {
    canvasState = data;
    // Broadcast to all other connected clients
    socket.broadcast.emit('canvas-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Canvas app will be available at http://localhost:3000`);
});