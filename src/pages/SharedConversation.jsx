import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaEye, FaCalendarAlt, FaShare, FaCopy, FaCheck } from 'react-icons/fa';
import RichMessageRenderer from '../components/RichMessageRenderer';
import neuraXAvatar from '../assets/NeuraXavatar.png';
import axios from 'axios';

const SharedConversation = () => {
  const { shareId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSharedConversation();
  }, [shareId]);

  const loadSharedConversation = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/share/${shareId}`);
      
      if (response.data.success) {
        setConversation(response.data.conversation);
      } else {
        setError('Conversation not found');
      }
    } catch (err) {
      console.error('Error loading shared conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Loading Conversation...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold mb-4">Conversation Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <a 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
          >
            Go to NeuraX
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-gray-800/50 px-4 md:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-600/30">
                <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  {conversation?.title || 'Shared NeuraX Conversation'}
                </h1>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <FaCalendarAlt />
                    <span>{formatTimestamp(conversation?.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaEye />
                    <span>{conversation?.viewCount} views</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={copyShareLink}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
            >
              {copied ? <FaCheck /> : <FaCopy />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="space-y-6">
          {conversation?.messages?.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-4 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="flex-shrink-0 mt-1">
                  {message.type === 'bot' ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-600/30">
                      <img src={neuraXAvatar} alt="NeuraX" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                      <FaUser className="text-gray-300 text-xs" />
                    </div>
                  )}
                </div>

                <div className={`max-w-3xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg'
                    : 'bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 text-gray-100 rounded-2xl rounded-tl-md px-4 py-3'
                }`}>
                  {message.image && (
                    <div className="mb-3">
                      <img 
                        src={message.image} 
                        alt="Shared" 
                        className="max-w-sm rounded-xl shadow-lg border border-gray-600/30"
                      />
                    </div>
                  )}
                  
                  <RichMessageRenderer 
                    content={message.content}
                    className="text-gray-200"
                  />
                  
                  <div className="mt-3 pt-2 border-t border-gray-700/20">
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-800/50 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400 mb-4">
            <FaShare />
            <span>Shared conversation from NeuraX AI</span>
          </div>
          <a 
            href="/"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold"
          >
            Start Your Own Conversation with NeuraX
          </a>
        </div>
      </div>
    </div>
  );
};

export default SharedConversation;