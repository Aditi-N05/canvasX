import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

function App() {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize Fabric.js canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: 'white',
    });

    // Set up socket connection
    const socketConnection = io('http://localhost:3001');

    setCanvas(fabricCanvas);
    setSocket(socketConnection);

    // Canvas event listeners
    fabricCanvas.on('selection:created', handleTextSelection);
    fabricCanvas.on('selection:updated', handleTextSelection);
    fabricCanvas.on('selection:cleared', () => {
      setSelectedText(null);
      setAiSuggestions([]);
    });

    // Socket event listeners
    socketConnection.on('canvas-update', (data) => {
      fabricCanvas.loadFromJSON(data, fabricCanvas.renderAll.bind(fabricCanvas));
    });

    return () => {
      fabricCanvas.dispose();
      socketConnection.disconnect();
    };
  }, []);

  const handleTextSelection = (e) => {
    if (e.selected && e.selected[0] && e.selected[0].type === 'textbox') {
      setSelectedText(e.selected[0]);
      generateAISuggestions(e.selected[0].text);
    }
  };

  const addTextBox = () => {
    if (!canvas) return;

    const textbox = new fabric.Textbox('Click to edit', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#333',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: 10,
      cornerColor: '#0066cc',
      cornerSize: 8,
      transparentCorners: false,
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    textbox.enterEditing();

    // Emit to other users
    emitCanvasUpdate();
  };

  const generateAISuggestions = async (text) => {
    if (!text || text.trim() === '' || text === 'Click to edit') return;

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/ai-suggestions', {
        text: text
      });
      setAiSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setAiSuggestions(['Error generating suggestions. Please try again.']);
    }
    setLoading(false);
  };

  const applySuggestion = (suggestion) => {
    if (!selectedText) return;

    selectedText.set('text', suggestion);
    canvas.renderAll();
    emitCanvasUpdate();
    setAiSuggestions([]);
  };

  const emitCanvasUpdate = () => {
    if (socket && canvas) {
      const canvasData = canvas.toJSON();
      socket.emit('canvas-update', canvasData);
    }
  };

  const clearCanvas = () => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = 'white';
      emitCanvasUpdate();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Collaborative AI Canvas</h1>
        <div className="toolbar">
          <button onClick={addTextBox} className="btn btn-primary">
            Add Text Box
          </button>
          <button onClick={clearCanvas} className="btn btn-secondary">
            Clear Canvas
          </button>
        </div>
      </header>

      <div className="canvas-container">
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} />
        </div>

        <div className="ai-panel">
          <h3>AI Suggestions</h3>
          {selectedText ? (
            <div>
              <p className="selected-text">
                Selected: "{selectedText.text}"
              </p>
              {loading ? (
                <div className="loading">Generating suggestions...</div>
              ) : (
                <div className="suggestions">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="suggestion-btn"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))
                  ) : (
                    <p className="no-suggestions">
                      {selectedText.text === 'Click to edit' 
                        ? 'Edit the text to get AI suggestions' 
                        : 'No suggestions available'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="no-selection">Select a text box to get AI suggestions</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;