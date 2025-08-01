import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaDesktop, FaEye, FaKeyboard, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

const SecurityInitModal = ({ 
  isOpen, 
  onAccept, 
  onCancel,
  quizType = 'quiz' // 'quiz' or 'battle'
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleAccept = async () => {
    if (!hasAccepted) return;
    
    setIsInitializing(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      onAccept();
    }, 1000);
  };

  const securityFeatures = [
    {
      icon: <FaDesktop className="text-blue-500" />,
      title: 'Fullscreen Mode Required',
      description: 'The quiz will run in fullscreen mode. Exiting fullscreen will trigger warnings.'
    },
    {
      icon: <FaEye className="text-green-500" />,
      title: 'Tab Switch Detection',
      description: 'Switching tabs or minimizing the window will be detected and warned against.'
    },
    {
      icon: <FaKeyboard className="text-purple-500" />,
      title: 'Keyboard Shortcuts Blocked',
      description: 'Developer tools and other shortcuts (F12, Ctrl+Shift+I, etc.) are disabled.'
    },
    {
      icon: <FaExclamationTriangle className="text-orange-500" />,
      title: 'Three Strike System',
      description: 'After 3 security violations, your quiz will be automatically submitted.'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <FaShieldAlt className="text-2xl" />
            <div>
              <h2 className="text-2xl font-bold">Exam Security System</h2>
              <p className="text-blue-100">
                {quizType === 'battle' ? 'Quiz Battle' : 'Quiz'} Security Protocols
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Important Notice
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This {quizType === 'battle' ? 'quiz battle' : 'quiz'} uses strict security measures to ensure fair play and prevent cheating. 
                    Please read and understand the following security features before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Security Features Active During This {quizType === 'battle' ? 'Battle' : 'Quiz'}:
            </h3>

            <div className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0 text-2xl">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Warning System Explanation */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Warning System
            </h4>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <p>• <strong>1st Violation:</strong> Warning message displayed</p>
              <p>• <strong>2nd Violation:</strong> Second warning with reminder</p>
              <p>• <strong>3rd Violation:</strong> Quiz automatically submitted</p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAccepted}
                onChange={(e) => setHasAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I understand and agree to the security measures. I acknowledge that violating these 
                security protocols may result in automatic submission of my {quizType === 'battle' ? 'battle' : 'quiz'} 
                and potential disqualification.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: hasAccepted ? 1.02 : 1 }}
              whileTap={{ scale: hasAccepted ? 0.98 : 1 }}
              onClick={handleAccept}
              disabled={!hasAccepted || isInitializing}
              className={`
                flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200
                ${hasAccepted && !isInitializing
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isInitializing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Initializing Security...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <FaCheck />
                  <span>Accept & Start {quizType === 'battle' ? 'Battle' : 'Quiz'}</span>
                </div>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={isInitializing}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityInitModal;