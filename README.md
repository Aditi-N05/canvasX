# Collaborative AI Canvas

A real-time collaborative canvas application with AI-powered text suggestions. Users can add text boxes to a shared canvas, edit them collaboratively, and get AI-powered suggestions to improve their content.

## Features

- 🖌️ **Interactive Canvas**: Add and edit text boxes on a shared canvas
- 🤖 **AI Suggestions**: Get intelligent text suggestions powered by AI
- 🔄 **Real-time Collaboration**: Multiple users can work on the same canvas simultaneously
- ✨ **Drag & Drop**: Move and resize text elements easily
- 💾 **Persistent State**: Canvas state is maintained across sessions

## Technologies Used

### Frontend
- **React** - UI framework
- **Fabric.js** - Interactive canvas library
- **Socket.io-client** - Real-time communication
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **Socket.io** - WebSocket server for real-time features
- **CORS** - Cross-origin resource sharing

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone or create the project directory**
   ```bash
   mkdir collaborative-ai-canvas
   cd collaborative-ai-canvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Project Structure**
   Create the following directory structure:
   ```
   collaborative-ai-canvas/
   ├── public/
   │   └── index.html
   ├── src/
   │   ├── App.js
   │   ├── App.css
   │   ├── index.js
   │   └── index.css
   ├── server/
   │   └── server.js
   ├── package.json
   └── .env
   ```

4. **Start the backend server**
   ```bash
   npm run server
   ```

5. **In a new terminal, start the React frontend**
   ```bash
   npm start
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Basic Operations
1. **Add Text Box**: Click the "Add Text Box" button to create a new editable text element
2. **Edit Text**: Double-click on any text box to start editing
3. **Get AI Suggestions**: Select a text box to see AI-powered suggestions in the right panel
4. **Apply Suggestions**: Click on any suggestion to replace the selected text
5. **Move Elements**: Drag text boxes around the canvas
6. **Resize Elements**: Use the corner handles to resize text boxes

### Collaboration
- Open the same URL in multiple browser windows or share with others
- Changes made by one user are instantly visible to all connected users
- Each user can edit different text boxes simultaneously

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3001
# OPENAI_API_KEY=your_openai_api_key_here  # Optional for real AI
FRONTEND_URL=http://localhost:3000
```

### AI Integration
The application includes two AI suggestion modes:

1. **Mock AI (Default)**: Uses rule-based suggestions for demonstration
2. **OpenAI Integration**: Uncomment the OpenAI section in `server/server.js` and add your API key

To enable OpenAI:
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env` file: `OPENAI_API_KEY=your_key_here`
3. Uncomment the OpenAI code in `server/server.js`

## API Endpoints

### POST `/api/ai-suggestions`
Generates text suggestions for the provided content.

**Request Body:**
```json
{
  "text": "Your text content here"
}
```

**Response:**
```json
{
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2",
    "Suggestion 3"
  ]
}
```

## WebSocket Events

### Client → Server
- `canvas-update`: Broadcasts canvas state changes to other users

### Server → Client
- `canvas-update`: Receives canvas state updates from other users

## Architecture

### Frontend Architecture
```
React App
├── Canvas Component (Fabric.js)
├── AI Suggestions Panel
├── Toolbar
└── Socket.io Client
```

### Backend Architecture
```
Express Server
├── REST API (/api/ai-suggestions)
├── Socket.io Server
├── Canvas State Management
└── AI Integration Layer
```

## Customization

### Adding New AI Providers
1. Create a new function in `server/server.js`
2. Add your provider's API integration
3. Update the suggestion generation logic

### Styling
- Modify `src/App.css` for component styling
- Update `src/index.css` for global styles
- Fabric.js canvas styling can be customized in the React component

### Canvas Features
Add new canvas features by:
1. Extending the Fabric.js configuration in `App.js`
2. Adding new toolbar buttons and handlers
3. Implementing corresponding backend logic if needed

## Troubleshooting

### Common Issues

1. **Canvas not loading**
   - Ensure Fabric.js is properly installed
   - Check browser console for errors

2. **Real-time sync not working**
   - Verify Socket.io server is running on port 3001
   - Check CORS configuration

3. **AI suggestions not appearing**
   - Check network tab for API call failures
   - Verify backend server is running

### Development Tips

- Use browser dev tools to inspect canvas events
- Check WebSocket connection in Network tab
- Monitor server logs for debugging real-time features

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Future Enhancements

- [ ] User authentication and sessions
- [ ] Canvas templates and presets
- [ ] Image upload and manipulation
- [ ] Advanced text formatting options
- [ ] Export to various formats (PDF, PNG, etc.)
- [ ] Voice-to-text integration
- [ ] Mobile responsiveness improvements
- [ ] Collaborative cursors and user presence indicators