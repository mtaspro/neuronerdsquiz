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
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [encryptedInput, setEncryptedInput] = useState('');
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
      loadHistory();
    } catch (error) {
      alert('Fetch failed: ' + error.message);
    }
  };

  const handleEncrypt = () => {
    setEncryptedInput(rot13(inputText));
  };

  const sendMessage = async () => {
    if (!encryptedInput.trim()) return;
    
    try {
      const token = secureStorage.getToken();
      await axios.post(`${API_URL}/api/secret-chat/send`, {
        phoneNumber,
        encryptedMessage: encryptedInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInputText('');
      setEncryptedInput('');
      loadHistory();
    } catch (error) {
      alert('Send failed: ' + error.message);
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
        
        <div className="bg-gray-800 p-4 rounded mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Target ID"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1 bg-gray-700 px-3 py-2 rounded"
          />
          <button onClick={fetchFromWhatsApp} className="bg-green-600 px-4 py-2 rounded">
            📥 Sync
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded mb-4 h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg._id} className="mb-2 text-left">
              <div className="font-mono text-sm text-gray-300">
                {msg.encrypted}
                {showDecrypted[msg._id] && (
                  <span className="ml-2 text-green-400">→ {msg.message}</span>
                )}
                <button 
                  onClick={() => {
                    const pwd = prompt('Code?');
                    if (pwd === '2BorNot2B') {
                      toggleDecrypt(msg._id);
                    } else {
                      alert('Wrong!');
                    }
                  }}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-300"
                >
                  {showDecrypted[msg._id] ? '🔒' : '🔓'}
                </button>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <textarea
            placeholder="Raw data..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-gray-700 px-3 py-2 rounded mb-2"
            rows="2"
          />
          <button onClick={handleEncrypt} className="bg-yellow-600 px-4 py-2 rounded mr-2">
            🔐 Encode
          </button>
          
          {encryptedInput && (
            <div className="mt-3 bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400 mb-1">Encoded:</div>
              <div className="font-mono mb-2">{encryptedInput}</div>
              <button onClick={sendMessage} className="bg-green-600 px-4 py-2 rounded">
                📤 Deploy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
