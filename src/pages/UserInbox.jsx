import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaEnvelope, FaEnvelopeOpen, FaWhatsapp } from 'react-icons/fa';
import { secureStorage } from '../utils/secureStorage.js';

const UserInbox = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, []);

  const fetchMessages = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await axios.get(`${apiUrl}/api/user/inbox`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      const response = await axios.get(`${apiUrl}/api/user/inbox/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = secureStorage.getToken();
      await axios.put(`${apiUrl}/api/user/inbox/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-800 dark:text-white text-xl">Loading inbox...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <FaWhatsapp className="text-3xl text-green-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">WhatsApp Inbox</h1>
              <p className="text-blue-200">
                Messages from WhatsApp (sent with @n prefix)
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {/* Info Box */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4 mb-6">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">📱 How to send messages to your inbox:</h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            Ask your WhatsApp contacts to start their message with <strong>@n</strong> followed by a space, 
            then their message. Example: <code className="bg-green-100 dark:bg-green-800 px-1 rounded">@n Hello, how are you?</code>
          </p>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <FaEnvelope className="text-6xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Messages sent to your WhatsApp with @n prefix will appear here
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${
                  !message.isRead ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {message.isRead ? (
                      <FaEnvelopeOpen className="text-gray-400" />
                    ) : (
                      <FaEnvelope className="text-blue-500" />
                    )}
                    <div>
                      <h4 className="font-semibold text-lg">
                        {message.senderName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {message.senderPhone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(message.createdAt)}
                    </p>
                    {!message.isRead && (
                      <button
                        onClick={() => markAsRead(message._id)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInbox;