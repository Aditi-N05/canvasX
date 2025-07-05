#!/bin/bash

# Collaborative AI Canvas - Setup Script
echo "🚀 Setting up Collaborative AI Canvas..."

# Create directory structure
echo "📁 Creating project structure..."
mkdir -p src
mkdir -p server
mkdir -p public

# Copy files to correct locations
echo "📄 Moving files to correct directories..."

# Move source files
if [ -f "src_App.js" ]; then
    mv src_App.js src/App.js
fi

if [ -f "src_App.css" ]; then
    mv src_App.css src/App.css
fi

if [ -f "src_index.js" ]; then
    mv src_index.js src/index.js
fi

if [ -f "src_index.css" ]; then
    mv src_index.css src/index.css
fi

# Move server files
if [ -f "server_server.js" ]; then
    mv server_server.js server/server.js
fi

# Move public files
if [ -f "public_index.html" ]; then
    mv public_index.html public/index.html
fi

echo "✅ Project structure created successfully!"
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start the backend server: npm run server"
echo "2. In a new terminal, start the frontend: npm start"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "💡 For AI features, add your OpenAI API key to the .env file"