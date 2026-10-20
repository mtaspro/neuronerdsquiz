import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { createSocket, addSocketListeners } from '../utils/socket.js';
import { secureStorage } from '../utils/secureStorage';
import '../styles/premium-glass.css';

const SKIN = 'notes-dark';
const SHOW_HINT = false;

const rot13 = (str) => {
  return str.replace(/[a-zA-Z]/g, c => 
    String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
  ).replace(/[অ-হ]/g, c => {
    const code = c.charCodeAt(0);
    const base = 0x0985;
    const offset = code - base;
    const newOffset = (offset + 13) % 53;
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
  const [markingRead, setMarkingRead] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState({});
  const newMessageIdsRef = useRef({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  /** When true, message updates scroll to bottom; set false when user scrolls up to read older messages */
  const stickToBottomRef = useRef(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const loadHistory = useCallback(async () => {
    try {
      const token = secureStorage.getToken();
      const res = await axios.get(`${API_URL}/api/secret-chat/history/${phoneNumber}?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const incomingIds = new Set(res.data.messages.map(m => m._id));
      setMessages(prev => {
        const prevIds = new Set(prev.map(m => m._id));
        const newMap = { ...newMessageIdsRef.current };
        res.data.messages.forEach(m => {
          if (!prevIds.has(m._id)) {
            newMap[m._id] = Date.now();
            setTimeout(() => setNewMessageIds(nm => { const n = { ...nm }; delete n[m._id]; return n; }), 4000);
          }
        });
        newMessageIdsRef.current = newMap;
        setNewMessageIds(newMap);
        return res.data.messages;
      });
      setNewMessageIds(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (!incomingIds.has(id)) delete next[id];
        });
        newMessageIdsRef.current = next;
        return next;
      });
    } catch (error) {
      console.error('Load error:', error);
    }
  }, [phoneNumber, API_URL]);

  useEffect(() => {
    if (authenticated && phoneNumber && mode === 'chat') {
      loadHistory();
      const interval = setInterval(() => loadHistory(), 10000);

      createSocket();
      const cleanupSocket = addSocketListeners({
        secretChatNewMessage: (data) => {
          if (data.phoneNumber === phoneNumber) {
            console.log('📡 [SOCKET] New friend message received, refreshing history');
            loadHistory();
          }
        }
      });

      return () => {
        clearInterval(interval);
        cleanupSocket();
      };
    }
  }, [phoneNumber, authenticated, mode, loadHistory]);

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [phoneNumber]);

  const updateStickToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    stickToBottomRef.current = distanceFromBottom < 100;
  }, []);

  useEffect(() => {
    if (!authenticated || mode !== 'chat') return;
    if (stickToBottomRef.current) {
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

  const markAsReadOnWhatsApp = async () => {
    if (!phoneNumber.trim()) {
      alert('Set Target ID (LID) in Config first.');
      return;
    }
    setMarkingRead(true);
    try {
      const token = secureStorage.getToken();
      const res = await axios.post(
        `${API_URL}/api/secret-chat/mark-read/${encodeURIComponent(phoneNumber)}`,
        { realNumber: realNumber.trim() || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Marked ${res.data.markedCount} message(s) as read on WhatsApp.`);
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Failed to mark as read');
    } finally {
      setMarkingRead(false);
    }
  };

  const handleKeyPress = async (e) => {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      
      if (mode === 'encoder') {
        if (!inputText.trim()) return;
        const result = rot13(inputText);
        setInputText(result);
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
        stickToBottomRef.current = true;
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
      <div className="sc-root sc-auth" data-skin={SKIN}>
        <div className="sc-auth-panel">
          <h2 className="sc-header-label">You are in the wrong way dude, what's your code?</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter code..."
              className="sc-input"
              autoFocus
            />
            <button
              type="submit"
              className="sc-button"
              style={{ marginTop: '16px' }}
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-root" data-skin={SKIN}>
      <div className="sc-header-bar">
        <span className="sc-header-label">Notes</span>
        <div className="sc-buttons">
          <button
            onClick={() => setMode(mode === 'chat' ? 'encoder' : 'chat')}
            className="sc-button sc-button-active"
          >
            {mode === 'chat' ? 'Chat' : 'Encoder'}
          </button>
        </div>
      </div>

      {mode === 'chat' ? (
        <>
          <div className="sc-config-panel">
            <div className="sc-buttons">
              <button
                onClick={() => setShowFields(!showFields)}
                className={`sc-button ${showFields ? 'sc-button-active' : ''}`}
              >
                GE
              </button>
              <button
                onClick={fetchFromWhatsApp}
                className="sc-button"
              >
                MINAI
              </button>
              <button
                type="button"
                onClick={markAsReadOnWhatsApp}
                disabled={markingRead}
                className={`sc-button ${markingRead ? 'sc-button-disabled' : ''}`}
                title="Mark latest messages as read on WhatsApp (blue ticks for your friend)"
                aria-label="Mark as read on WhatsApp"
              >
                {markingRead ? '…' : 'AI'}
              </button>
            </div>
            {showFields && (
              <div className="sc-config">
                <input
                  type="text"
                  placeholder="Target ID (LID)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="sc-input"
                />
                <input
                  type="text"
                  placeholder="Real number"
                  value={realNumber}
                  onChange={(e) => setRealNumber(e.target.value)}
                  className="sc-input"
                />
              </div>
            )}
          </div>

          <ol
            ref={messagesContainerRef}
            onScroll={updateStickToBottom}
            className="sc-list"
          >
            {messages.map((msg, index) => {
              const isFriend = msg.sender === 'friend';
              let textClass = 'sc-text';
              if (SKIN === 'log') textClass = 'sc-text-log';
              if (SKIN === 'assistant') textClass = 'sc-text-assistant';
              return (
                <li
                  key={msg._id}
                  className={`sc-row ${isFriend ? 'friend' : 'mine'}`}
                >
                  {!isFriend && SKIN === 'assistant' && <span className="sc-avatar"></span>}
                  <span className="sc-num">
                    {index + 1}.
                    {newMessageIds[msg._id] && <span className="sc-new-dot"></span>}
                  </span>
                  <span className={textClass}>
                    {showDecrypted[msg._id] ? msg.message : msg.encrypted}
                  </span>
                </li>
              );
            })}
            <div ref={messagesEndRef} />
          </ol>

          <div className="sc-composer-wrap">
            <textarea
              placeholder="Raw data... (Shift+Enter to send)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="sc-composer"
              rows="3"
              spellCheck={false}
            />
            {SHOW_HINT && (
              <div className="sc-hint">
                Shift+Enter: Send | Ctrl+[1-9,0]: 1st-10th | Ctrl+[Q-P]: 11th-20th
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="sc-config-panel">
            <h2 className="sc-header-label">Text Encoder/Decoder</h2>
            <textarea
              placeholder="Enter text... (Shift+Enter to encode/decode)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="sc-input sc-input-encoder"
              rows="6"
              spellCheck={false}
            />
            {SHOW_HINT && (
              <div className="sc-hint">
                Shift+Enter: Toggle encode/decode in same box
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
