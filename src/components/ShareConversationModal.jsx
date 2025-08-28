import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShare, FaTimes, FaCopy, FaCheck, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';

const ShareConversationModal = ({ isOpen, onClose, messages, title }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generateShareLink = async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('sessionToken');
      
      const response = await axios.post(`${apiUrl}/api/share/conversation`, {
        messages: messages,
        title: title || 'NeuraX Conversation'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShareUrl(response.data.shareUrl);
      } else {
        setError('Failed to generate share link');
      }
    } catch (err) {
      console.error('Share error:', err);
      setError('Failed to create shareable link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  const handleClose = () => {
    setShareUrl('');
    setError('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FaShare className="text-2xl text-blue-400" />
            <h2 className="text-xl font-bold text-white">Share Conversation</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="text-gray-300 text-sm">
            Create a shareable link for this conversation. Anyone with the link can view the full conversation.
          </div>

          {!shareUrl && !loading && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateShareLink}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <FaShare />
              <span>Generate Share Link</span>
            </motion.button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-2xl text-blue-400 mr-3" />
              <span className="text-gray-300">Creating shareable link...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {shareUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                <div className="text-xs text-gray-400 mb-2">Shareable Link:</div>
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-600/30 font-mono text-sm text-gray-200 break-all">
                  {shareUrl}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    copied 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                      : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                  }`}
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  onClick={openInNewTab}
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 rounded-lg font-semibold transition-all duration-200"
                >
                  <FaExternalLinkAlt />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>

              <div className="text-xs text-gray-400 text-center">
                💡 Anyone with this link can view your conversation
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ShareConversationModal;