import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCopy, FaTimes, FaShare, FaUsers, FaCheck } from 'react-icons/fa';

const BattleRoomNotification = ({ roomId, isVisible, onClose, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      onCopy && onCopy(roomId);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join my Quiz Battle!',
      text: `Join my quiz battle room with code: ${roomId}`,
      url: window.location.origin + `/battle/${roomId}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`Join my quiz battle! Room code: ${roomId}\nLink: ${shareData.url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-2xl border border-white border-opacity-20 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white border-opacity-20">
              <div className="flex items-center space-x-2">
                <FaUsers className="text-yellow-400 text-lg" />
                <h3 className="text-white font-bold text-lg">Battle Room Created!</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-white text-sm mb-4">
                Share this room code with your friends to join the battle:
              </p>
              
              {/* Room Code Display */}
              <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-4 border border-white border-opacity-20">
                <div className="text-center">
                  <div className="text-xs text-gray-300 mb-1">Room Code</div>
                  <div className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
                    {roomId}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    copied 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
                  }`}
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-semibold transition-all duration-200"
                >
                  <FaShare />
                  <span>Share</span>
                </motion.button>
              </div>

              {/* Instructions */}
              <div className="mt-4 text-xs text-gray-300 text-center">
                Players can join by entering this code or clicking the shared link
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BattleRoomNotification;