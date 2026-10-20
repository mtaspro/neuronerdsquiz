import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { createSocket, addSocketListeners } from '../utils/socket.js';
import { secureStorage } from '../utils/secureStorage';
import '../styles/premium-glass.css';

const SKIN = 'assistant';
const SHOW_HINT = false;
const NUMBER_FROM = 'top';
const LAYOUT = 'stream';
const MARKER = 'quote';
const QUOTE_CHAR = "'";

const isEmptyContent = (text) => {
  return !text || /^[.?\s]*$/.test(text);
};

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

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CaretIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ComposeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ThreeDotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="12" r="2" fill="currentColor" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <circle cx="18" cy="12" r="2" fill="currentColor" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15V4m0 0l3 3m-3-3l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThumbUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 7v14M12 7l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7V3m-4 4l2-2m4-2v2m-2 0l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17V3M12 3l3 3m-3-3l-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17v4m4-4l-2-2m-4 2l2 2m-2-2l2-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12a8 8 0 0112.9-.7M4 12l3-3m-3 3l3 3m6.9-11.7A8 8 0 0120 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.74 19.74 0 01-8.63-3.07 19.1 19.1 0 01-5-5 19.25 19.25 0 01-3-5 2 2 0 01.94-2.46 19.7 19.7 0 018.62-.87A11.84 11.84 0 0121 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 5H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 5l6 6M9 5V3a2 2 0 012-2h7a2 2 0 012 2v5a2 2 0 01-2 2v0a2 2 0 01-2-2V5a2 2 0 00-2-2h-3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const configDropdownRef = useRef(null);
  const hamburgerRef = useRef(null);
  /** When true, message updates scroll to bottom; set false when user scrolls up to read older messages */
  const stickToBottomRef = useRef(true);

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
          const slot = parseInt(e.key) - 1;
          const index = NUMBER_FROM === 'bottom' ? messages.length - 1 - slot : slot;
          if (messages[index]) {
            toggleDecrypt(messages[index]._id);
          }
        }
        else if (e.key === '0') {
          e.preventDefault();
          const slot = 9;
          const index = NUMBER_FROM === 'bottom' ? messages.length - 1 - slot : slot;
          if (messages[index]) {
            toggleDecrypt(messages[index]._id);
          }
        }
        else if ('QWERTYUIOP'.includes(e.key.toUpperCase())) {
          e.preventDefault();
          const keyIndex = 'QWERTYUIOP'.indexOf(e.key.toUpperCase());
          const slot = 10 + keyIndex;
          const index = NUMBER_FROM === 'bottom' ? messages.length - 1 - slot : slot;
          if (messages[index]) {
            toggleDecrypt(messages[index]._id);
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

  const groupMessages = (msgs) => {
    const turns = [];
    msgs.forEach(msg => {
      const isFriend = msg.sender === 'friend';
      const lastTurn = turns[turns.length - 1];
      if (lastTurn && lastTurn.isFriend === isFriend) {
        lastTurn.messages.push(msg);
      } else {
        turns.push({ isFriend, messages: [msg] });
      }
    });
    return turns;
  };

  const renderStreamMessage = (msg) => {
    const isFriend = msg.sender === 'friend';
    const visibleText = showDecrypted[msg._id] ? msg.message : msg.encrypted;
    const isEmpty = isEmptyContent(visibleText);

    const content = (
      <span
        className={`sc-stream-text ${isEmpty ? 'sc-empty' : ''}`}
        onClick={() => toggleDecrypt(msg._id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleDecrypt(msg._id); }}
      >
        {MARKER === 'quote' && isFriend && <span className="sc-quote">{QUOTE_CHAR}</span>}
        {visibleText}
        {MARKER === 'apostrophe' && <span className="sc-apostrophe">'</span>}
      </span>
    );
    return { content, isEmpty, isFriend };
  };

  useEffect(() => {
    if (!showFields) return;
    const handleClickOutside = (e) => {
      const isInsideDropdown = configDropdownRef.current?.contains(e.target);
      const isHamburger = hamburgerRef.current?.contains(e.target);
      if (!isInsideDropdown && !isHamburger) {
        setShowFields(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFields]);

  if (!authenticated) {
    return (
      <div className="sc-root sc-auth" data-skin={SKIN}>
        <div className="sc-auth-panel">
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
      <div className="sc-top-bar">
        <div
          className="sc-top-icon sc-icon-btn"
          ref={hamburgerRef}
          onClick={() => setShowFields(!showFields)}
          aria-label="Menu"
          title="Menu"
        >
          <HamburgerIcon />
        </div>
        <div className="sc-title">
          <span>Assistant</span>
          <span className="sc-dim">Auto</span>
          <span
            className="sc-title-caret"
            onClick={() => setMode(mode === 'chat' ? 'encoder' : 'chat')}
            aria-label="Model"
            title="Model"
            role="button"
          >
            <CaretIcon />
          </span>
        </div>
        <div className="sc-top-icons">
          <div
            className="sc-top-icon"
            onClick={fetchFromWhatsApp}
            aria-label="New chat"
            title="New chat"
          >
            <ComposeIcon />
          </div>
          <div
            className="sc-top-icon"
            onClick={markAsReadOnWhatsApp}
            aria-label="More"
            title="More"
            style={{ opacity: markingRead ? 0.5 : 1 }}
          >
            <ThreeDotIcon />
          </div>
        </div>
      </div>

      {showFields && (
        <div className="sc-config-dropdown" ref={configDropdownRef}>
          <input
            type="text"
            placeholder="Field 1"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="sc-config-input"
          />
          <input
            type="text"
            placeholder="Field 2"
            value={realNumber}
            onChange={(e) => setRealNumber(e.target.value)}
            className="sc-config-input"
          />
        </div>
      )}

      <ol
        ref={messagesContainerRef}
        onScroll={updateStickToBottom}
        className="sc-list"
      >
        {LAYOUT === 'stream'
          ? (() => {
              const items = [];
              messages.forEach(msg => {
                const { content } = renderStreamMessage(msg);
                items.push(
                  <p key={msg._id} className="sc-stream-paragraph">
                    {content}
                  </p>
                );
              });

              const lastMsg = messages[messages.length - 1];
              const isLastFriend = lastMsg?.sender === 'friend';

              return (
                <>
                  {items}
                  {isLastFriend && (
                    <div className="sc-action-row">
                      <span className="sc-action-icon" aria-label="like"><ThumbUpIcon /></span>
                      <span className="sc-action-icon" aria-label="dislike"><ThumbDownIcon /></span>
                      <span className="sc-action-icon" aria-label="refresh"><RefreshIcon /></span>
                      <span className="sc-action-icon" aria-label="share"><ShareIcon /></span>
                      <span
                        className="sc-action-icon"
                        aria-label="copy"
                        onClick={(e) => { e.stopPropagation(); toggleDecrypt(lastMsg._id); }}
                      >
                        <CopyIcon />
                      </span>
                    </div>
                  )}
                </>
              );
            })()
          : LAYOUT === 'single'
          ? (() => {
              const turns = groupMessages(messages);
              const lastFriendTurnIdx = turns.findLastIndex(t => t.isFriend);
              return turns.map((turn, turnIdx) => {
                const isFriend = turn.isFriend;
                const isLastFriendTurn = isFriend && turnIdx === lastFriendTurnIdx;
                return (
                  <li
                    key={`${turnIdx}`}
                    className={`sc-turn ${isFriend ? 'friend' : 'mine'}`}
                  >
                    {turn.messages.map(msg => (
                      <p
                        key={msg._id}
                        className="sc-msg-paragraph"
                        onClick={() => toggleDecrypt(msg._id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleDecrypt(msg._id); }}
                      >
                        {showDecrypted[msg._id] ? msg.message : msg.encrypted}
                      </p>
                    ))}
                    {isLastFriendTurn && (
                      <div className="sc-action-row">
                        <span className="sc-action-icon" aria-label="like"><ThumbUpIcon /></span>
                        <span className="sc-action-icon" aria-label="dislike"><ThumbDownIcon /></span>
                        <span className="sc-action-icon" aria-label="refresh"><RefreshIcon /></span>
                        <span className="sc-action-icon" aria-label="share"><ShareIcon /></span>
                        <span
                          className="sc-action-icon"
                          aria-label="copy"
                          onClick={(e) => { e.stopPropagation(); toggleDecrypt(turn.messages[turn.messages.length - 1]._id); }}
                        >
                          <CopyIcon />
                        </span>
                      </div>
                    )}
                  </li>
                );
              });
            })()
          : messages.map((msg, index) => {
              const isFriend = msg.sender === 'friend';
              const isLatest = index === messages.length - 1;
              return (
                <li
                  key={msg._id}
                  className={`sc-msg ${isFriend ? 'friend' : 'mine'}`}
                >
                  {!isFriend && <span className="sc-avatar"></span>}
                  <span
                    className={`sc-msg-text ${isFriend ? 'friend' : 'mine'}`}
                  >
                    {showDecrypted[msg._id] ? msg.message : msg.encrypted}
                  </span>
                  {isFriend && isLatest && (
                    <div className="sc-action-row">
                      <span className="sc-action-icon" aria-label="like"><ThumbUpIcon /></span>
                      <span className="sc-action-icon" aria-label="dislike"><ThumbDownIcon /></span>
                      <span className="sc-action-icon" aria-label="refresh"><RefreshIcon /></span>
                      <span className="sc-action-icon" aria-label="share"><ShareIcon /></span>
                      <span
                        className="sc-action-icon"
                        aria-label="copy"
                        onClick={(e) => { e.stopPropagation(); toggleDecrypt(msg._id); }}
                      >
                        <CopyIcon />
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
        <div ref={messagesEndRef} />
      </ol>

      <div className="sc-disclaimer">
        AI can make mistakes. Double-check responses.
      </div>

      <div className="sc-composer-wrap">
        <div className="sc-pill">
          <span className="sc-pill-icon" aria-label="add"><PlusIcon /></span>
          <textarea
            placeholder="Ask anything"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="sc-textarea"
            rows="1"
            spellCheck={false}
          />
          <span className="sc-pill-icon" aria-label="mic"><MicIcon /></span>
        </div>
      </div>
    </div>
  );
}
