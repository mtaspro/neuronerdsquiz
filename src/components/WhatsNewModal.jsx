import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar } from 'react-icons/fa';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

let DotLottieReact = null;
try {
  const module = require('@lottiefiles/dotlottie-react');
  DotLottieReact = module.DotLottieReact;
} catch (e) {
  DotLottieReact = null;
}

export default function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return;
    
    const checkAndShowModal = async () => {
      console.log('🔍 WhatsNewModal: Checking modal status...');
      try {
        const token = secureStorage.getToken();
        if (!token) {
          console.log('❌ WhatsNewModal: No token found, skipping modal for non-registered user');
          setChecked(true);
          return;
        }

        console.log('✅ WhatsNewModal: Token found, checking backend status');
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${apiUrl}/api/user/whats-new-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('📊 WhatsNewModal: Backend response:', response.data);
        if (!response.data.hasSeenWhatsNew) {
          console.log('🎉 WhatsNewModal: User hasn\'t seen modal, showing in 1.5s');
          setTimeout(() => {
            console.log('🚀 WhatsNewModal: Opening modal now!');
            setIsOpen(true);
          }, 1500);
        } else {
          console.log('✋ WhatsNewModal: User already seen modal, skipping');
        }
        setChecked(true);
      } catch (error) {
        console.error('❌ WhatsNewModal: Error checking status:', error);
        setChecked(true);
      }
    };

    checkAndShowModal();
  }, [checked]);

  const handleClose = async () => {
    console.log('🔒 WhatsNewModal: Closing modal and marking as seen');
    setIsOpen(false);
    try {
      const token = secureStorage.getToken();
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await axios.post(`${apiUrl}/api/user/mark-whats-new-seen`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ WhatsNewModal: Successfully marked as seen in database');
      }
    } catch (error) {
      console.error('❌ WhatsNewModal: Error marking as seen:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Background - Fixed Position */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            onClick={handleClose}
          />
          
          {/* Modal Container - Fixed Position at Center */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="glass rounded-2xl p-8 border border-cyan-500/30 shadow-2xl">
              {/* Cute Doggy Animation or Fallback */}
              <div className="flex justify-center mb-6 -mx-8 -mt-8 bg-black/40 rounded-t-2xl py-4">
                <div className="w-32 h-32 flex items-center justify-center">
                  {DotLottieReact ? (
                    <>
                      {console.log('🐶 WhatsNewModal: Lottie animation loaded successfully')}
                      <DotLottieReact
                        src="https://lottie.host/8fbc7853-f51c-48ca-a55d-44b79e3c4e50/EnNpLry7Oz.json"
                        loop
                        autoplay
                      />
                    </>
                  ) : (
                    <>
                      {console.log('🐕 WhatsNewModal: Using fallback emoji animation')}
                      <motion.div
                        className="text-6xl"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        🐕
                      </motion.div>
                    </>
                  )}
                </div>
              </div>

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
                    <p className="text-sm text-gray-300">Vibrant orange-cyan-green gradient with smooth animations</p>
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
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
