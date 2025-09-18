import React, { useRef, useEffect, useState } from 'react';
import { FaPen, FaUndo, FaRedo, FaSave, FaPalette, FaFont, FaRedoAlt } from 'react-icons/fa';

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
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Load existing marked image if available, otherwise load original
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      drawRotatedImage(img, ctx, rotation);
      saveToHistory();
    };
    
    // Use existing marked image if available, otherwise use original
    img.src = existingMarkedImage || imageUrl;
  }, [imageUrl, existingMarkedImage, rotation]);

  const drawRotatedImage = (img, ctx, angle) => {
    const canvas = canvasRef.current;
    
    // Calculate new canvas dimensions based on rotation
    if (angle === 90 || angle === 270) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context, translate and rotate
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((angle * Math.PI) / 180);
    
    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  const rotateImage = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    // Calculate actual canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    if (tool === 'text') {
      setTextPosition({ x, y });
      setShowTextInput(true);
      return;
    }
    
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || tool === 'text') return;
    
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
    
    // Set font properties
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.textBaseline = 'top';
    
    // Add text with white outline for better visibility
    ctx.strokeText(textValue, textPosition.x, textPosition.y);
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
        
        <div className="border-l border-gray-300 h-8 mx-2"></div>
        
        <button
          onClick={rotateImage}
          className="p-2 rounded bg-orange-500 hover:bg-orange-600 text-white"
          title="Rotate 90°"
        >
          <FaRedoAlt />
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
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`border border-gray-300 dark:border-gray-600 max-w-full ${
            tool === 'text' ? 'cursor-text' : 'cursor-crosshair'
          }`}
          style={{ 
            display: 'block', 
            margin: '0 auto',
            touchAction: 'none'
          }}
        />
        
        {/* Text Input Modal */}
        {showTextInput && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Text Annotation</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Text Content</label>
                <input
                  type="text"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter your text here..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && addText()}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quick Text Options</label>
                <div className="flex flex-wrap gap-2">
                  {['✓ Correct', '✗ Wrong', '👍 Good', '👎 Poor', '⭐ Excellent', '❓ Unclear'].map(option => (
                    <button
                      key={option}
                      onClick={() => setTextValue(option)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 text-sm"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={addText}
                  disabled={!textValue.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Add Text
                </button>
                <button
                  onClick={() => {
                    setShowTextInput(false);
                    setTextValue('');
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
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