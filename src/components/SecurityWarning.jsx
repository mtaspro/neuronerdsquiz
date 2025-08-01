import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaShieldAlt, FaEye, FaDesktop } from 'react-icons/fa';

const SecurityWarning = ({ 
  violation, 
  warnings, 
  maxWarnings, 
  onDismiss,
  autoHide = true,
  hideDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, onDismiss]);

  const getViolationIcon = (type) => {
    switch (type) {
      case 'fullscreen_exit':
        return <FaDesktop className="text-2xl" />;
      case 'tab_switch':
      case 'window_blur':
        return <FaEye className="text-2xl" />;
      case 'blocked_shortcut':
        return <FaShieldAlt className="text-2xl" />;
      default:
        return <FaExclamationTriangle className="text-2xl" />;
    }
  };

  const getViolationMessage = (type, details) => {
    switch (type) {
      case 'fullscreen_exit':
        return 'You exited fullscreen mode. Please stay in fullscreen during the exam.';
      case 'tab_switch':
        return 'Tab switching detected. Please stay on the quiz page.';
      case 'window_blur':
        return 'Window focus lost. Please keep the quiz window active.';
      case 'blocked_shortcut':
        return `Blocked shortcut detected: ${details}. Such actions are not allowed during the exam.`;
      default:
        return 'Security violation detected. Please follow exam guidelines.';
    }
  };

  const getWarningColor = (warnings, maxWarnings) => {
    const ratio = warnings / maxWarnings;
    if (ratio <= 0.33) return 'yellow';
    if (ratio <= 0.66) return 'orange';
    return 'red';
  };

  const warningColor = getWarningColor(warnings, maxWarnings);
  const remainingWarnings = maxWarnings - warnings;

  if (!violation) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-l-4 p-4
            ${warningColor === 'yellow' ? 'border-yellow-500' : ''}
            ${warningColor === 'orange' ? 'border-orange-500' : ''}
            ${warningColor === 'red' ? 'border-red-500' : ''}
          `}>
            <div className="flex items-start space-x-3">
              <div className={`
                flex-shrink-0 p-2 rounded-full
                ${warningColor === 'yellow' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
                ${warningColor === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : ''}
                ${warningColor === 'red' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' : ''}
              `}>
                {getViolationIcon(violation.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`
                    text-sm font-semibold
                    ${warningColor === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' : ''}
                    ${warningColor === 'orange' ? 'text-orange-800 dark:text-orange-200' : ''}
                    ${warningColor === 'red' ? 'text-red-800 dark:text-red-200' : ''}
                  `}>
                    ⚠️ Security Warning {warnings}/{maxWarnings}
                  </h3>
                  
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setTimeout(onDismiss, 300);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {getViolationMessage(violation.type, violation.details)}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${warningColor === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                    ${warningColor === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                    ${warningColor === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : ''}
                  `}>
                    {remainingWarnings > 0 
                      ? `${remainingWarnings} warning${remainingWarnings !== 1 ? 's' : ''} remaining`
                      : 'Final warning - Quiz will auto-submit'
                    }
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(violation.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress bar showing warning level */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(warnings / maxWarnings) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`
                    h-2 rounded-full transition-colors duration-300
                    ${warningColor === 'yellow' ? 'bg-yellow-500' : ''}
                    ${warningColor === 'orange' ? 'bg-orange-500' : ''}
                    ${warningColor === 'red' ? 'bg-red-500' : ''}
                  `}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SecurityWarning;