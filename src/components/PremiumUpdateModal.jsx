import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSparkles } from 'react-icons/fa';
import '../styles/premium-glass.css';

let DotLottieReact = null;
try {
  const module = require('@lottiefiles/dotlottie-react');
  DotLottieReact = module.DotLottieReact;
} catch (e) {
  DotLottieReact = null;
}

export default function PremiumUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal to all users after 2 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Blurred Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-panel p-8 border border-purple-500/30 shadow-2xl">
              {/* Premium Animation */}
              <div className="flex justify-center mb-6 -mx-8 -mt-8 bg-black/40 rounded-t-2xl py-4">
                <div className="w-32 h-32 flex items-center justify-center">
                  {DotLottieReact ? (
                    <>
                      <DotLottieReact
                        src="https://lottie.host/8fbc7853-f51c-48ca-a55d-44b79e3c4e50/EnNpLry7Oz.json"
                        loop
                        autoplay
                      />
                    </>
                  ) : (
                    <motion.div
                      className="text-6xl"
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1.5, repeat: Infinity }
                      }}
                    >
                      💎
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-lg neon-pulse">
                    <FaSparkles className="text-purple-400 text-xl" />
                  </div>
                  <h2 className="premium-font premium-heading text-2xl text-white">Premium Update</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-purple-500/20 rounded-lg transition-all"
                >
                  <FaTimes className="text-gray-400 hover:text-purple-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="text-purple-400 text-xl">🌟</div>
                  <div>
                    <h3 className="premium-font premium-heading text-white mb-1">Premium Dark/Glass UI</h3>
                    <p className="text-sm text-gray-300">Experience the new unified glassmorphism design system</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-cyan-400 text-xl">🔮</div>
                  <div>
                    <h3 className="premium-font premium-heading text-white mb-1">Glass Panels</h3>
                    <p className="text-sm text-gray-300">Translucent panels with blur effects across all pages</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-green-400 text-xl">✨</div>
                  <div>
                    <h3 className="premium-font premium-heading text-white mb-1">Glow Effects</h3>
                    <p className="text-sm text-gray-300">Neon glow animations for top ranks and premium buttons</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-yellow-400 text-xl">👻</div>
                  <div>
                    <h3 className="premium-font premium-heading text-white mb-1">Ghostly Styling</h3>
                    <p className="text-sm text-gray-300">Darker opacity for Secret Chat with subtle transitions</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-pink-400 text-xl">🎯</div>
                  <div>
                    <h3 className="premium-font premium-heading text-white mb-1">Premium Typography</h3>
                    <p className="text-sm text-gray-300">Clean Inter/Geist font with refined spacing</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 mb-6" />

              {/* Footer */}
              <p className="text-xs text-gray-400 mb-4">Enjoy the premium experience! 💎</p>

              {/* Button */}
              <button
                onClick={handleClose}
                className="premium-button-purple w-full py-3 rounded-lg font-semibold text-white transition-all"
              >
                Explore Now 🚀
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
