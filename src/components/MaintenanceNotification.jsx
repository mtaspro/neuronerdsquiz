import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MaintenanceNotification = ({ isVisible, onComplete }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9998] bg-orange-500 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-orange-400"
        >
          <div className="flex items-center space-x-4">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-lg">Deployment Starting Soon</h3>
              <p className="text-sm">Please save your work and exit if needed.</p>
            </div>
            <div className="bg-white text-orange-500 px-3 py-2 rounded-full font-bold text-xl min-w-[60px] text-center">
              {countdown}s
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaintenanceNotification;