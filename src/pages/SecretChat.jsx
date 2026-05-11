import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';
import '../styles/premium-glass.css';

const rot13 = (str) => {
  return str.replace(/[a-zA-Z]/g, c => 
    String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
  ).replace(/[অ-হ]/g, c => {
    // Bengali vowels and consonants (অ-হ)
    const code = c.charCodeAt(0);
    const base = 0x0985; // Start of Bengali block
    const offset = code - base;
    const newOffset = (offset + 13) % 53; // 53 Bengali characters
    return String.fromCharCode(base + newOffset);
  });
};

export default function SecretChat() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [realNumber, setRealNumber] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showDecrypted, setShowDecrypted] = useState({});
  const [showFields, setShowFields] = useState(false);
  const [mode, setMode] = useState('chat');
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const loadHistory = useCallback(async () => {
    try {
      const token = secureStorage.getToken();
      const res = await axios.get(`${API_URL}/api/secret-chat/history/${phoneNumber}?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Load error:', error);
    }
  }, [phoneNumber, API_URL]);

  useEffect(() => {
    if (authenticated && phoneNumber && mode === 'chat') {
      loadHistory();
      // Enable real-time sync every 7 seconds
      const interval = setInterval(() => loadHistory(), 7000);
      return () => clearInterval(interval);
    }
  }, [phoneNumber, authenticated, mode, loadHistory]);

  useEffect(() => {
    if (authenticated && mode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, authenticated, mode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === 'chat' && e.ctrlKey) {
        if (!isNaN(e.key) && e.key !== '0') {
          e.preventDefault();
          const index = parseInt(e.key) - 1;
          if (messages[index]) {
            toggleDecrypt(messages[index]._id);
          }
        }
        else if (e.key === '0') {
          e.preventDefault();
          if (messages[9]) {
            toggleDecrypt(messages[9]._id);
          }
        }
        else if ('QWERTYUIOP'.includes(e.key.toUpperCase())) {
          e.preventDefault();
          const keyIndex = 'QWERTYUIOP'.indexOf(e.key.toUpperCase());
          const messageIndex = 10 + keyIndex;
          if (messages[messageIndex]) {
            toggleDecrypt(messages[messageIndex]._id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages, mode]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '2BorNot2B') {
      setAuthenticated(true);
    } else {
      alert('Wrong code!');
      setPassword('');
    }
  };

  const fetchFromWhatsApp = async () => {
    try {
      const token = secureStorage.getToken();
      await axios.post(`${API_URL}/api/secret-chat/fetch-whatsapp/${phoneNumber}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadHistory();
    } catch (error) {
      alert('Fetch failed: ' + error.message);
    }
  };

  const handleKeyPress = async (e) => {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      
      if (mode === 'encoder') {
        if (!inputText.trim()) return;
        const result = rot13(inputText);
        setInputText(result); // Replace text in same box
        return;
      }
      
      if (!inputText.trim() || !realNumber.trim()) {
        alert('Enter both Target ID and Real number');
        return;
      }
      
      const encrypted = rot13(inputText);
      
      try {
        const token = secureStorage.getToken();
        await axios.post(`${API_URL}/api/secret-chat/send`, {
          phoneNumber,
          realNumber,
          encryptedMessage: encrypted
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setInputText('');
        await loadHistory();
      } catch (error) {
        alert('Send failed: ' + error.message);
      }
    }
  };

  const toggleDecrypt = (id) => {
    setShowDecrypted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!authenticated) {
    return (
      <div className="premium-glass-background min-h-screen text-white flex items-center justify-center relative">
        {/* Mesh Gradient Effect */}
        <div className="mesh-gradient-purple"></div>
        <div className="mesh-gradient-green"></div>
        <div className="mesh-gradient-blue"></div>
        
        <div className="glass-panel p-8 max-w-md w-full relative z-10">
          <h2 className="premium-font premium-heading text-2xl mb-6 text-center text-red-500">
            You are in the wrong way dude, what's your code?
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter code..."
              className="w-full bg-gray-700/50 border border-gray-600/50 px-4 py-3 rounded mb-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full premium-button py-3 rounded font-bold"
              style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.8), rgba(153, 27, 27, 0.8))', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)' }}
            >
              🔓 Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-glass-background min-h-screen text-white p-4 sm:p-8 relative">
      {/* Mesh Gradient Effect */}
      <div className="mesh-gradient-purple"></div>
      <div className="mesh-gradient-green"></div>
      <div className="mesh-gradient-blue"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="premium-font premium-heading text-3xl">🔐 X-Protocol</h1>
          <button
            onClick={() => setMode(mode === 'chat' ? 'encoder' : 'chat')}
            className="premium-button-purple px-4 py-2 rounded text-sm"
          >
            {mode === 'chat' ? '💬 Chat' : '🔐 Encoder'}
          </button>
        </div>
        
        {mode === 'chat' ? (
          <>
            <div className="glass-panel p-4 rounded mb-4">
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setShowFields(!showFields)}
                  className="glass-panel px-3 py-2 rounded text-sm"
                >
                  ⚙️ Config
                </button>
                <button onClick={fetchFromWhatsApp} className="glass-panel px-4 py-2 rounded">
                  📥 Sync
                </button>
              </div>
              {showFields && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Target ID (LID)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/50 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="Real number"
                    value={realNumber}
                    onChange={(e) => setRealNumber(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600/50 px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            <div className="glass-panel p-4 rounded mb-4 h-96 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={msg._id} className="mb-2 text-left">
                  <span className="text-gray-500 mr-2">
                    {index + 1}{msg.sender === 'friend' ? "'" : ''}.
                  </span>
                  <span className="font-mono text-sm text-gray-300">
                    {showDecrypted[msg._id] ? msg.message : msg.encrypted}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="glass-panel p-4 rounded">
              <textarea
                placeholder="Raw data... (Shift+Enter to send)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-gray-700/50 border border-gray-600/50 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
              />
              <div className="text-xs text-gray-500 mt-2">
                Shift+Enter: Send | Ctrl+[1-9,0]: 1st-10th | Ctrl+[Q-P]: 11th-20th
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="glass-panel p-4 rounded mb-4">
              <h2 className="premium-font premium-heading text-lg mb-3">🔐 Text Encoder/Decoder</h2>
              <textarea
                placeholder="Enter text... (Shift+Enter to encode/decode)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full bg-gray-700/50 border border-gray-600/50 px-3 py-2 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="6"
              />
              <div className="text-xs text-gray-500">
                Shift+Enter: Toggle encode/decode in same box
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}