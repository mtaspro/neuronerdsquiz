import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const rot13 = (str) => str.replace(/[a-zA-Z]/g, c => 
  String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
);

export default function SecretChat() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [realNumber, setRealNumber] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showDecrypted, setShowDecrypted] = useState({});
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (authenticated && phoneNumber) loadHistory();
  }, [phoneNumber, authenticated]);

  useEffect(() => {
    if (authenticated) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, authenticated]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        // Handle Ctrl+1-9 for messages 1-9
        if (!isNaN(e.key) && e.key !== '0') {
          e.preventDefault();
          const index = parseInt(e.key) - 1;
          if (messages[index]) {
            toggleDecrypt(messages[index]._id);
          }
        }
        // Handle Ctrl+0 for 10th message
        else if (e.key === '0') {
          e.preventDefault();
          if (messages[9]) {
            toggleDecrypt(messages[9]._id);
          }
        }
        // Handle Ctrl+Q,W,E,R,T,Y,U,I,O,P for messages 11-20
        else if ('QWERTYUIOP'.includes(e.key.toUpperCase())) {
          e.preventDefault();
          const keyIndex = 'QWERTYUIOP'.indexOf(e.key.toUpperCase());
          const messageIndex = 10 + keyIndex; // 11th-20th message
          if (messages[messageIndex]) {
            toggleDecrypt(messages[messageIndex]._id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '2BorNot2B') {
      setAuthenticated(true);
    } else {
      alert('Wrong code!');
      setPassword('');
    }
  };

  const loadHistory = async () => {
    try {
      const token = secureStorage.getToken();
      const res = await axios.get(`${API_URL}/api/secret-chat/history/${phoneNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Load error:', error);
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
      
      if (!inputText.trim() || !realNumber.trim()) {
        alert('Enter both Target ID and Real number');
        return;
      }
      
      const encrypted = rot13(inputText);
      
      try {
        const token = secureStorage.getToken();
        await axios.post(`${API_URL}/api/secret-chat/send`, {
          phoneNumber, // LID for saving
          realNumber,  // Real number for sending
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center text-red-500">
            You are in the wrong way dude, what's your code?
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter code..."
              className="w-full bg-gray-700 px-4 py-3 rounded mb-4 text-center text-lg"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded font-bold"
            >
              🔓 Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🔐 X-Protocol</h1>
        
        <div className="bg-gray-800 p-4 rounded mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Target ID (LID for fetch)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 bg-gray-700 px-3 py-2 rounded text-sm"
            />
            <button onClick={fetchFromWhatsApp} className="bg-green-600 px-4 py-2 rounded">
              📥 Sync
            </button>
          </div>
          <input
            type="text"
            placeholder="Real number (for sending)"
            value={realNumber}
            onChange={(e) => setRealNumber(e.target.value)}
            className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
          />
        </div>

        <div className="bg-gray-800 p-4 rounded mb-4 h-96 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={msg._id} className="mb-2 text-left">
              <span className="text-gray-500 mr-2">{index + 1}.</span>
              <span className="font-mono text-sm text-gray-300">
                {showDecrypted[msg._id] ? msg.message : msg.encrypted}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <textarea
            placeholder="Raw data... (Shift+Enter to send)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full bg-gray-700 px-3 py-2 rounded"
            rows="3"
          />
          <div className="text-xs text-gray-500 mt-2">
            Shift+Enter: Send | Ctrl+[1-9,0]: 1st-10th | Ctrl+[Q-P]: 11th-20th
          </div>
        </div>
      </div>
    </div>
  );
}
