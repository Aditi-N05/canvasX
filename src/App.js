import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // --- NEW: Flag and queue for remote updates
  const isApplyingRemoteUpdate = useRef(false);
  const loadQueue = useRef(Promise.resolve());

  // --- NEW: State for text formatting options
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState('#333');
  const [textAlign, setTextAlign] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);


  // Memoize generateAISuggestions to ensure stable reference for handleTextSelection
  const generateAISuggestions = useCallback(async (text) => {
    if (!text || text.trim() === '' || text === 'Click to edit') {
      setAiSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/ai-suggestions`, {
        selectedText: text
      });
      setAiSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setAiSuggestions(['Failed to get suggestions. Check server logs.']);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as it doesn't depend on any props or state that change


  // Memoize handleTextSelection to ensure stable reference for Fabric.js event listener
  const handleTextSelection = useCallback((e) => {
    if (e.selected && e.selected[0] && e.selected[0].type === 'textbox') {
      const currentSelectedTextbox = e.selected[0];
      setSelectedText(currentSelectedTextbox);
      generateAISuggestions(currentSelectedTextbox.text);

      // --- NEW: Update formatting states based on selected textbox
      setFontSize(currentSelectedTextbox.fontSize || 16);
      setFontColor(currentSelectedTextbox.fill || '#333');
      setTextAlign(currentSelectedTextbox.textAlign || 'left');

      const fontWeight = currentSelectedTextbox.fontWeight || 'normal';
      const fontStyle = currentSelectedTextbox.fontStyle || 'normal';
      const underline = currentSelectedTextbox.underline || false;

      setIsBold(fontWeight === 'bold');
      setIsItalic(fontStyle === 'italic');
      setIsUnderline(underline);

    } else {
      // Clear selection
      setSelectedText(null);
      setAiSuggestions([]);
      // Reset formatting states when no textbox is selected
      setFontSize(16);
      setFontColor('#333');
      setTextAlign('left');
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
    }
  }, [generateAISuggestions]); // Dependency on generateAISuggestions

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: 'white',
      selection: true, // Enable selection
    });

    const socketConnection = io(backendUrl);
    setCanvas(fabricCanvas);
    setSocket(socketConnection);

    // Function to broadcast canvas state (includes custom properties)
    const broadcastUpdate = () => {
      if (isApplyingRemoteUpdate.current) return;
      const json = fabricCanvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']);
      socketConnection.emit('canvas-update', json);
    };

    fabricCanvas.on('object:added', broadcastUpdate);
    fabricCanvas.on('object:modified', broadcastUpdate);
    fabricCanvas.on('text:changed', broadcastUpdate);

    // Use the memoized handleTextSelection
    fabricCanvas.on('selection:created', handleTextSelection);
    fabricCanvas.on('selection:updated', handleTextSelection);
    fabricCanvas.on('selection:cleared', () => {
      setSelectedText(null);
      setAiSuggestions([]);
    });

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
  }, [handleTextSelection]);


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
      // Default formatting for new text boxes
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      textAlign: 'left',
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    textbox.enterEditing();
  };

  const clearCanvas = () => {
    if (canvas && socket) {
      canvas.clear();
      canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));
      socket.emit('canvas-clear');
    }
  };

  const applySuggestion = (suggestion) => {
    if (!selectedText) return;
    selectedText.set('text', suggestion);
    canvas.renderAll();
    setAiSuggestions([]);
    if (canvas && socket) {
      const json = canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']);
      socket.emit('canvas-update', json);
    }
  };

  // --- NEW: Formatting Handlers ---
  const handleBoldToggle = () => {
    if (selectedText) {
      const newBoldState = !isBold;
      selectedText.set('fontWeight', newBoldState ? 'bold' : 'normal');
      setIsBold(newBoldState);
      canvas.renderAll();
      socket.emit('canvas-update', canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']));
    }
  };

  const handleItalicToggle = () => {
    if (selectedText) {
      const newItalicState = !isItalic;
      selectedText.set('fontStyle', newItalicState ? 'italic' : 'normal');
      setIsItalic(newItalicState);
      canvas.renderAll();
      socket.emit('canvas-update', canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']));
    }
  };

  const handleUnderlineToggle = () => {
    if (selectedText) {
      const newUnderlineState = !isUnderline;
      selectedText.set('underline', newUnderlineState);
      setIsUnderline(newUnderlineState);
      canvas.renderAll();
      socket.emit('canvas-update', canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']));
    }
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && newSize > 0 && selectedText) {
      selectedText.set('fontSize', newSize);
      setFontSize(newSize);
      canvas.renderAll();
      socket.emit('canvas-update', canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']));
    }
  };

  const handleFontColorChange = (e) => {
    const newColor = e.target.value;
    if (selectedText) {
      selectedText.set('fill', newColor);
      setFontColor(newColor);
      canvas.renderAll();
      socket.emit('canvas-update', canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']));
    }
  };

  const handleTextAlignChange = (alignment) => {
    if (selectedText) {
      selectedText.set('textAlign', alignment);
      setTextAlign(alignment);
      canvas.renderAll();
      socket.emit('canvas-update', canvas.toJSON(['id', 'fontSize', 'fill', 'textAlign', 'fontWeight', 'fontStyle', 'underline']));
    }
  };


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

          {/* --- NEW: Formatting Controls --- */}
          {selectedText && selectedText.type === 'textbox' && (
            <div className="text-formatting-controls">
              <button
                onClick={handleBoldToggle}
                className={`btn btn-format ${isBold ? 'active' : ''}`}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={handleItalicToggle}
                className={`btn btn-format ${isItalic ? 'active' : ''}`}
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                onClick={handleUnderlineToggle}
                className={`btn btn-format ${isUnderline ? 'active' : ''}`}
                title="Underline"
              >
                <u>U</u>
              </button>

              <input
                type="number"
                value={fontSize}
                onChange={handleFontSizeChange}
                min="1"
                className="font-size-input"
                title="Font Size"
              />

              <input
                type="color"
                value={fontColor}
                onChange={handleFontColorChange}
                className="font-color-picker"
                title="Font Color"
              />

              <button
                onClick={() => handleTextAlignChange('left')}
                className={`btn btn-format ${textAlign === 'left' ? 'active' : ''}`}
                title="Align Left"
              >
                <i className="fas fa-align-left"></i> {/* Requires Font Awesome or similar */}
              </button>
              <button
                onClick={() => handleTextAlignChange('center')}
                className={`btn btn-format ${textAlign === 'center' ? 'active' : ''}`}
                title="Align Center"
              >
                <i className="fas fa-align-center"></i>
              </button>
              <button
                onClick={() => handleTextAlignChange('right')}
                className={`btn btn-format ${textAlign === 'right' ? 'active' : ''}`}
                title="Align Right"
              >
                <i className="fas fa-align-right"></i>
              </button>
            </div>
          )}
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