import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';

// Notification Context
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper methods for different notification types
  const success = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'success', message });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'error', message, duration: 7000 });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'warning', message });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({ ...options, type: 'info', message });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Individual Notification Component
const Notification = ({ notification, onRemove }) => {
  const { id, type, message, title, action } = notification;

  const typeConfig = {
    success: {
      icon: FaCheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-500',
      textColor: 'text-green-800 dark:text-green-200',
    },
    error: {
      icon: FaExclamationCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      textColor: 'text-red-800 dark:text-red-200',
    },
    warning: {
      icon: FaExclamationTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    info: {
      icon: FaInfoCircle,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800 dark:text-blue-200',
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg p-4 shadow-lg max-w-sm w-full
        backdrop-blur-sm
      `}
    >
      <div className="flex items-start">
        <IconComponent className={`${config.iconColor} text-lg mt-0.5 mr-3 flex-shrink-0`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          <p className="text-sm">{message}</p>
          
          {action && (
            <div className="mt-2">
              <button
                onClick={action.onClick}
                className="text-xs font-medium underline hover:no-underline"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(id)}
          className={`${config.iconColor} hover:opacity-70 ml-2 flex-shrink-0`}
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
};

// Notification Container
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationProvider;