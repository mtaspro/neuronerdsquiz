import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndShowModal = async () => {
      try {
        const token = secureStorage.getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/user/whats-new-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.hasSeenWhatsNew) {
          setTimeout(() => setIsOpen(true), 1000);
        }
      } catch (error) {
        console.error('Error checking whats-new status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAndShowModal();
  }, []);

  const handleClose = async () => {
    setIsOpen(false);
    try {
      const token = secureStorage.getToken();
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await axios.post(`${apiUrl}/api/user/mark-whats-new-seen`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error marking whats-new as seen:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="glass rounded-2xl max-w-md w-full p-8 border border-cyan-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg">
                  <FaStar className="text-cyan-400 text-xl" />
                </div>
                <h2 className="text-2xl font-bold gradient-text">What's New</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all hover-lift"
              >
                <FaTimes className="text-gray-400 hover:text-cyan-400" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="text-cyan-400 text-xl">✨</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Modern Design Overhaul</h3>
                  <p className="text-sm text-gray-300">Glassmorphism, neon effects, and smooth animations for a 2026 vibe</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-purple-400 text-xl">⚡</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Energetic Transitions</h3>
                  <p className="text-sm text-gray-300">Dynamic page navigation with zoom, rotate, and blur effects</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-green-400 text-xl">🔐</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Secret Chat Mode</h3>
                  <p className="text-sm text-gray-300">Encrypted messaging with ROT13 + Bengali support</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-yellow-400 text-xl">🎨</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Interactive Elements</h3>
                  <p className="text-sm text-gray-300">Hover effects, micro-interactions, and smooth feedback</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 mb-6" />

            {/* Footer */}
            <p className="text-xs text-gray-400 mb-4">Enjoy the new look! This message appears only once.</p>

            {/* Button */}
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 hover:from-cyan-500/50 hover:to-purple-500/50 border border-cyan-500/50 rounded-lg font-semibold text-white transition-all hover-lift neon-border"
            >
              Let's Go! 🚀
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
