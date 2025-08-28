import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaTimes, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const ImportConversationModal = ({ isOpen, onClose, onImport }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const extractShareId = (url) => {
    // Extract share ID from various URL formats
    const patterns = [
      /\/share\/([a-zA-Z0-9]{12})/,
      /shareId=([a-zA-Z0-9]{12})/,
      /^([a-zA-Z0-9]{12})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleImport = async () => {
    if (!shareUrl.trim()) {
      setError('Please enter a share link or ID');
      return;
    }

    const shareId = extractShareId(shareUrl.trim());
    if (!shareId) {
      setError('Invalid share link format');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/share/${shareId}`);
      
      if (response.data.success) {
        const conversation = response.data.conversation;
        
        // Import the conversation
        onImport(conversation.messages, conversation.title);
        
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError('Conversation not found');
      }
    } catch (err) {
      console.error('Import error:', err);
      if (err.response?.status === 404) {
        setError('Conversation not found or has been deleted');
      } else {
        setError('Failed to import conversation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setError('');
    setSuccess(false);
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
            <FaDownload className="text-2xl text-green-400" />
            <h2 className="text-xl font-bold text-white">Import Conversation</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <FaTimes />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <FaCheck className="text-4xl text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Conversation Imported!</h3>
            <p className="text-gray-300 text-sm">You can now continue chatting from where it left off.</p>
          </motion.div>
        )}

        {/* Import Form */}
        {!success && (
          <div className="space-y-4">
            <div className="text-gray-300 text-sm">
              Paste a shared conversation link to import it into your chat and continue the conversation.
            </div>

            <div>
              <label htmlFor="share-url" className="block text-sm font-semibold text-gray-300 mb-2">
                Share Link or ID
              </label>
              <input
                id="share-url"
                type="text"
                value={shareUrl}
                onChange={(e) => {
                  setShareUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://yoursite.com/share/abc123xyz789 or abc123xyz789"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400 transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              
              <motion.button
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                onClick={handleImport}
                disabled={!shareUrl.trim() || loading}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                  !shareUrl.trim() || loading
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg'
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <FaDownload />
                    <span>Import</span>
                  </>
                )}
              </motion.button>
            </div>

            <div className="text-xs text-gray-400 text-center">
              💡 You can paste the full URL or just the share ID
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ImportConversationModal;