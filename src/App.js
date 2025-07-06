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

  // --- NEW: Flag and queue for remote updates
  const isApplyingRemoteUpdate = useRef(false);
  const loadQueue = useRef(Promise.resolve());

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: 'white',
    });

    const socketConnection = io('http://localhost:3001');
    setCanvas(fabricCanvas);
    setSocket(socketConnection);

    // Only broadcast if not applying remote update
    const broadcastUpdate = () => {
      if (isApplyingRemoteUpdate.current) return;
      const json = fabricCanvas.toJSON(['id']);
      socketConnection.emit('canvas-update', json);
    };

    fabricCanvas.on('object:added', broadcastUpdate);
    fabricCanvas.on('object:modified', broadcastUpdate);
    fabricCanvas.on('text:changed', broadcastUpdate);

    fabricCanvas.on('selection:created', handleTextSelection);
    fabricCanvas.on('selection:updated', handleTextSelection);
    fabricCanvas.on('selection:cleared', () => {
      setSelectedText(null);
      setAiSuggestions([]);
    });

    // --- FIX: Queue and suppress event loop for remote updates
    socketConnection.on('canvas-update', (json) => {
      loadQueue.current = loadQueue.current.then(() => {
        return new Promise((resolve) => {
          isApplyingRemoteUpdate.current = true;
          fabricCanvas.loadFromJSON(json, () => {
            fabricCanvas.renderAll();
            isApplyingRemoteUpdate.current = false;
            resolve();
          });
        });
      });
    });

    socketConnection.on('canvas-clear', () => {
      isApplyingRemoteUpdate.current = true;
      fabricCanvas.clear();
      fabricCanvas.setBackgroundColor('white', fabricCanvas.renderAll.bind(fabricCanvas));
      isApplyingRemoteUpdate.current = false;
    });

    return () => {
      fabricCanvas.dispose();
      socketConnection.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  const handleTextSelection = (e) => {
    const obj = e.selected && e.selected[0];
    if (obj && obj.type === 'textbox') {
      setSelectedText(obj);
      generateAISuggestions(obj.text);
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
    // No need to broadcast, handled by 'object:added'
  };

  const clearCanvas = () => {
    if (canvas && socket) {
      canvas.clear();
      canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));
      socket.emit('canvas-clear');
    }
  };

  const generateAISuggestions = async (text) => {
    if (!text || text.trim() === '' || text === 'Click to edit') return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/ai-suggestions', {
        text: text,
      });
      setAiSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error(error);
      setAiSuggestions(['Error generating suggestions.']);
    }
    setLoading(false);
  };

  const applySuggestion = (suggestion) => {
  if (!selectedText) return;
  selectedText.set('text', suggestion);
  canvas.renderAll();
  setAiSuggestions([]);
  // Manually trigger broadcast to sync with other clients
  if (canvas && socket) {
    const json = canvas.toJSON(['id']);
    socket.emit('canvas-update', json);
  }
};
    // Will be broadcast by 'object:modified'


  return (
    <div className="App">
      <header className="App-header">
        <h1>CanvasX: Collaborative AI Canvas</h1>
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
              <p className="selected-text">Selected: "{selectedText.text}"</p>
              {loading ? (
                <div className="loading">Generating suggestions...</div>
              ) : (
                <div className="suggestions">
                  {aiSuggestions.length > 0 ? (
                    aiSuggestions.map((s, i) => (
                      <button key={i} className="suggestion-btn" onClick={() => applySuggestion(s)}>
                        {s}
                      </button>
                    ))
                  ) : (
                    <p className="no-suggestions">{selectedText.text === 'Click to edit' 
                        ? 'Edit the text to get AI suggestions' 
                        : 'No suggestions available'}</p>
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
