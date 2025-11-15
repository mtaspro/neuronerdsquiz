import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const Notepad = () => {
  const [content, setContent] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState([]);
  const [lastMessageId, setLastMessageId] = useState(0);
  const textareaRef = useRef(null);

  // Fetch WhatsApp groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const token = secureStorage.getToken();
        const response = await axios.get(`${apiUrl}/api/whatsapp/groups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.success) {
          setGroups(response.data.groups);
        }
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    fetchGroups();
  }, []);

  // Poll for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const token = secureStorage.getToken();
        if (!token) return;
        
        const response = await axios.get(`${apiUrl}/api/notepad/poll?lastId=${lastMessageId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
      let message = lastLine.substring(7);
      if (message && groupId) {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const token = secureStorage.getToken();
          await axios.post(`${apiUrl}/api/notepad/send`, {
            groupId,
            message
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
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
        const token = secureStorage.getToken();
        const response = await axios.get(`${apiUrl}/api/notepad/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
        const token = secureStorage.getToken();
        await axios.post(`${apiUrl}/api/notepad/clear`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setContent('');
        setLastMessageId(0);
      } catch (error) {
        console.error('Clear error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-gray-700 dark:to-gray-800 px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Notepad</h1>
            <div className="flex items-center space-x-2">
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-48 px-2 py-1 text-xs bg-white/20 border border-white/30 rounded text-white focus:outline-none focus:bg-white/30"
              >
                <option value="" className="text-gray-800">Select Config</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id} className="text-gray-800">
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="p-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-[600px] p-6 font-mono text-sm border-none focus:outline-none dark:bg-gray-800 dark:text-gray-300 resize-none bg-white"
              placeholder="Type your notes here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notepad;
