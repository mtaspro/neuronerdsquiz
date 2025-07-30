import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaPlay, FaTrophy, FaTimes } from 'react-icons/fa';

const BattleNotification = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 ${
              notification.type === 'success' ? 'border-green-500' :
              notification.type === 'warning' ? 'border-yellow-500' :
              notification.type === 'error' ? 'border-red-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`text-lg ${
                  notification.type === 'success' ? 'text-green-500' :
                  notification.type === 'warning' ? 'text-yellow-500' :
                  notification.type === 'error' ? 'text-red-500' :
                  'text-blue-500'
                }`}>
                  {notification.type === 'user-joined' && <FaUsers />}
                  {notification.type === 'user-left' && <FaUsers />}
                  {notification.type === 'battle-started' && <FaPlay />}
                  {notification.type === 'battle-ended' && <FaTrophy />}
                  {notification.type === 'user-finished' && <FaTrophy />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemove(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BattleNotification; 