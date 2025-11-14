import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { authHeader } from '../utils/auth';

const Notepad = () => {
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [lastMessageId, setLastMessageId] = useState(0);
  const textareaRef = useRef(null);

  // Poll for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/notepad/poll?lastId=${lastMessageId}`, {
          headers: authHeader()
        });
        
        if (response.data.messages.length > 0) {
          response.data.messages.forEach(msg => {
            if (msg.type === 'received') {
              const disguised = disguiseMessage(msg.message);
              setContent(prev => prev + '\n' + disguised);
            }
          });
          setLastMessageId(response.data.totalCount);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    };

    const interval = setInterval(pollMessages, 2000);
    return () => clearInterval(interval);
  }, [lastMessageId]);

  const disguiseMessage = (message) => {
    const paragraphs = [
      `The system architecture demonstrates ${message} which provides excellent scalability.`,
      `According to recent studies, ${message} shows promising results in performance metrics.`,
      `Implementation details reveal that ${message} offers significant advantages.`,
      `Technical documentation indicates ${message} as a viable solution.`,
      `Analysis suggests that ${message} meets all requirements effectively.`
    ];
    return paragraphs[Math.floor(Math.random() * paragraphs.length)];
  };

  const handleKeyDown = async (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      await processCommand();
    }
  };

  const processCommand = async () => {
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1] || '';

    // ::send command
    if (lastLine.startsWith('::send ')) {
      const message = lastLine.substring(7).trim();
      if (message && groupId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          await axios.post(`${apiUrl}/api/notepad/send`, {
            groupId,
            message
          }, {
            headers: authHeader()
          });
          
          // Remove the ::send line
          lines.pop();
          setContent(lines.join('\n'));
        } catch (error) {
          console.error('Send error:', error);
        }
      }
    }
    
    // ::Hist command
    else if (lastLine.trim() === '::Hist') {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/notepad/history`, {
          headers: authHeader()
        });
        
        lines.pop();
        const historyText = response.data.history.map(msg => 
          `[${msg.type === 'sent' ? 'YOU' : 'THEM'}] ${msg.message}`
        ).join('\n');
        
        setContent(lines.join('\n') + '\n\n--- HISTORY ---\n' + historyText + '\n--- END ---\n');
      } catch (error) {
        console.error('History error:', error);
      }
    }
    
    // ::clear command
    else if (lastLine.trim() === '::clear') {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await axios.post(`${apiUrl}/api/notepad/clear`, {}, {
          headers: authHeader()
        });
        setContent('');
        setLastMessageId(0);
      } catch (error) {
        console.error('Clear error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
          <input
            type="text"
            placeholder="WhatsApp Group ID"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-96 p-4 font-mono text-sm border-none focus:outline-none dark:bg-gray-800 dark:text-gray-300 resize-none"
            placeholder="Type here... Use ::send <message> and Ctrl+Enter to send. Use ::Hist for history. Use ::clear to clear all."
          />
        </div>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>Commands: ::send &lt;msg&gt; | ::Hist | ::clear</p>
          <p>Shortcuts: :sm: 😊 | :thumb: 👍 | :j: 😂 | :thinking: 🤔 | :l: 🥰</p>
        </div>
      </div>
    </div>
  );
};

export default Notepad;
