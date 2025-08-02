import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const BadgeNotification = ({ 
  notification, 
  onClose, 
  autoHide = true, 
  hideDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!notification) return null;

  const isEarned = !notification.previousHolder;
  const isLost = !!notification.previousHolder;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className={`
            rounded-lg shadow-2xl border-2 p-4 backdrop-blur-sm
            ${isEarned 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600'
            }
          `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-lg
                  ${isEarned 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                  }
                `}>
                  {isEarned ? '🎉' : '⚠️'}
                </div>
                <span className={`
                  font-bold text-sm
                  ${isEarned 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                  }
                `}>
                  {isEarned ? 'Badge Earned!' : 'Badge Lost!'}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Badge Info */}
            <div className="flex items-center space-x-3 mb-3">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg border-2
                ${isEarned 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-300'
                }
              `}>
                <span className="text-white font-bold">
                  {notification.icon}
                </span>
              </div>
              <div className="flex-1">
                <div className={`
                  font-semibold
                  ${isEarned 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                  }
                `}>
                  {notification.displayName}
                </div>
                {notification.value && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Value: {notification.value}
                  </div>
                )}
              </div>
            </div>

            {/* Message */}
            <div className={`
              text-sm
              ${isEarned 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
              }
            `}>
              {isEarned ? (
                <>
                  🎉 Congratulations! You've earned the <strong>{notification.displayName}</strong> badge!
                </>
              ) : (
                <>
                  You've lost the <strong>{notification.displayName}</strong> badge to{' '}
                  <strong>{notification.newHolder.username}</strong>
                </>
              )}
            </div>

            {/* Progress bar for auto-hide */}
            {autoHide && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <motion.div
                    className={`
                      h-1 rounded-full
                      ${isEarned ? 'bg-green-500' : 'bg-red-500'}
                    `}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: hideDelay / 1000, ease: "linear" }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BadgeNotification;