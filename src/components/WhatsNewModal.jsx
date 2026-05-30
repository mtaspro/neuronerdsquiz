import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';
import getEnvironmentConfig from '../config/environment';

const WHATS_NEW_SEEN_KEY = 'hscaura_whats_new_seen';

let DotLottieReact = null;
try {
  const module = require('@lottiefiles/dotlottie-react');
  DotLottieReact = module.DotLottieReact;
} catch (e) {
  DotLottieReact = null;
}

function getApiUrl() {
  const { apiUrl } = getEnvironmentConfig();
  return apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000';
}

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;

    const checkAndShowModal = async () => {
      try {
        const token = secureStorage.getToken();
        if (!token) {
          setChecked(true);
          return;
        }

        if (localStorage.getItem(WHATS_NEW_SEEN_KEY) === 'true') {
          setChecked(true);
          return;
        }

        const apiUrl = getApiUrl();
        const response = await axios.get(`${apiUrl}/api/user/whats-new-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.hasSeenWhatsNew === true) {
          localStorage.setItem(WHATS_NEW_SEEN_KEY, 'true');
          setChecked(true);
          return;
        }

        setTimeout(() => setIsOpen(true), 1500);
        setChecked(true);
      } catch (error) {
        if (localStorage.getItem(WHATS_NEW_SEEN_KEY) === 'true') {
          setChecked(true);
          return;
        }
        console.error('WhatsNewModal: Error checking status:', error);
        setChecked(true);
      }
    };

    checkAndShowModal();
  }, [checked]);

  const markAsSeen = async () => {
    const token = secureStorage.getToken();
    if (!token) return;

    const apiUrl = getApiUrl();
    await axios.post(
      `${apiUrl}/api/user/mark-whats-new-seen`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    localStorage.setItem(WHATS_NEW_SEEN_KEY, 'true');
  };

  const handleClose = async () => {
    try {
      await markAsSeen();
    } catch (error) {
      console.error('WhatsNewModal: Error marking as seen:', error);
      localStorage.setItem(WHATS_NEW_SEEN_KEY, 'true');
    } finally {
      setIsOpen(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass rounded-2xl p-8 border border-cyan-500/30 shadow-2xl">
              <div className="flex justify-center mb-6 -mx-8 -mt-8 bg-black/40 rounded-t-2xl py-4">
                <div className="w-32 h-32 flex items-center justify-center">
                  {DotLottieReact ? (
                    <DotLottieReact
                      src="https://lottie.host/8fbc7853-f51c-48ca-a55d-44b79e3c4e50/EnNpLry7Oz.json"
                      loop
                      autoplay
                    />
                  ) : (
                    <motion.div
                      className="text-6xl"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🐕
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg">
                    <FaStar className="text-cyan-400 text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold gradient-text">What&apos;s New</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-cyan-500/20 rounded-lg transition-all hover-lift"
                  aria-label="Close"
                >
                  <FaTimes className="text-gray-400 hover:text-cyan-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="text-cyan-400 text-xl">✨</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Premium Dark/Glass UI</h3>
                    <p className="text-sm text-gray-300">Unified glassmorphism design with mesh gradient backgrounds</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-purple-400 text-xl">🔮</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Glass Panel Styling</h3>
                    <p className="text-sm text-gray-300">Translucent panels with blur effects across Dashboard, Leaderboard & Secret Chat</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-green-400 text-xl">🌟</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Glow Effects</h3>
                    <p className="text-sm text-gray-300">Neon glow animations for top ranks and premium buttons</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-yellow-400 text-xl">👻</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Ghostly Chat Bubbles</h3>
                    <p className="text-sm text-gray-300">Darker opacity for Secret Chat with subtle hover transitions</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-pink-400 text-xl">🎯</div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Premium Typography</h3>
                    <p className="text-sm text-gray-300">Clean Inter/Geist font with bold headings and refined spacing</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 mb-6" />

              <p className="text-xs text-gray-400 mb-4">Enjoy the new look! This message appears only once.</p>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 hover:from-cyan-500/50 hover:to-purple-500/50 border border-cyan-500/50 rounded-lg font-semibold text-white transition-all hover-lift neon-border"
              >
                Let&apos;s Go! 🚀
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
