import React, { useRef, useEffect, useState } from 'react';
import { FaPen, FaUndo, FaRedo, FaSave, FaPalette, FaFont } from 'react-icons/fa';

const ImageMarker = ({ imageUrl, onSave, onCancel, existingMarkedImage }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load existing marked image if available, otherwise load original
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      saveToHistory();
    };
    
    // Use existing marked image if available, otherwise use original
    img.src = existingMarkedImage || imageUrl;
  }, [imageUrl, existingMarkedImage]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
      return;
    }
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || tool === 'text') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
    }
  };

  const addText = () => {
    if (!textValue.trim()) {
      setShowTextInput(false);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    
    // Add text with emoji support
    ctx.fillText(textValue, textPosition.x, textPosition.y);
    
    setTextValue('');
    setShowTextInput(false);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onSave(blob);
    }, 'image/png');
  };

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-gray-700 border-b">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600'}`}
        >
          <FaPen />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`p-2 rounded ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-600'}`}
        >
          <FaFont />
        </button>

        
        <div className="flex items-center space-x-2">
          <FaPalette />
          {colors.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        
        {tool === 'pen' ? (
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(e.target.value)}
            className="w-20"
          />
        ) : (
          <input
            type="range"
            min="12"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="w-20"
            title="Font Size"
          />
        )}
        
        <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded bg-white dark:bg-gray-600 disabled:opacity-50">
          <FaUndo />
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded bg-white dark:bg-gray-600 disabled:opacity-50">
          <FaRedo />
        </button>
        
        <div className="flex-1" />
        
        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded flex items-center">
          <FaSave className="mr-2" />
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded">
          Cancel
        </button>
      </div>
      
      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-800 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`border border-gray-300 dark:border-gray-600 max-w-full ${
            tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
          }`}
          style={{ display: 'block', margin: '0 auto' }}
        />
        
        {/* Text Input Modal */}
        {showTextInput && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Add Text</h3>
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Enter text (emojis supported: 😊 ✓ ✗ 👍)"
                className="w-full p-2 border rounded mb-3"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && addText()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={addText}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Add Text
                </button>
                <button
                  onClick={() => setShowTextInput(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageMarker;