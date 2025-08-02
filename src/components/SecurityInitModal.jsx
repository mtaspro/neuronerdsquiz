import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaDesktop, FaEye, FaKeyboard, FaExclamationTriangle, FaCheck, FaExpand } from 'react-icons/fa';

const SecurityInitModal = ({ 
  isOpen, 
  onAccept, 
  onCancel,
  quizType = 'quiz' // 'quiz' or 'battle'
}) => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Function to attempt fullscreen immediately
  const attemptFullscreen = async () => {
    try {
      const element = document.documentElement;
      
      // Check if fullscreen is supported
      const isFullscreenSupported = !!(
        element.requestFullscreen ||
        element.webkitRequestFullscreen ||
        element.msRequestFullscreen ||
        element.mozRequestFullScreen
      );

      if (!isFullscreenSupported) {
        console.warn('⚠️ Fullscreen API not supported in this browser');
        return false;
      }

      // Check if already in fullscreen
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        document.mozFullScreenElement
      );

      if (isCurrentlyFullscreen) {
        console.log('✅ Already in fullscreen mode');
        return true;
      }

      console.log('🖥️ Requesting fullscreen immediately...');
      
      // Try different fullscreen methods
      if (element.requestFullscreen) {
        await element.requestFullscreen({ navigationUI: "hide" });
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      }
      
      console.log('✅ Fullscreen request sent successfully');
      return true;
      
    } catch (error) {
      console.warn('⚠️ Fullscreen request failed:', error);
      return false;
    }
  };

  const handleAccept = async () => {
    if (!hasAccepted) return;
    
    setIsInitializing(true);
    
    // Attempt fullscreen immediately while we have user gesture
    console.log('🔒 Attempting fullscreen before security initialization...');
    await attemptFullscreen();
    
    // Call onAccept immediately after fullscreen attempt
    onAccept();
  };

  const securityFeatures = [
    {
      icon: <FaDesktop className="text-blue-500" />,
      title: 'Fullscreen Mode (Automatic)',
      description: 'The quiz will automatically enter fullscreen mode when you start. This helps maintain focus and prevents distractions during the exam.'
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <FaExpand className="text-blue-600 dark:text-blue-400 text-xl flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Automatic Fullscreen
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    When you click "Accept & Start {quizType === 'battle' ? 'Battle' : 'Quiz'}", the browser will automatically 
                    enter fullscreen mode to provide an optimal exam environment. If fullscreen fails, 
                    the quiz will continue with other security measures.
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
                and potential disqualification. I also understand that the browser will attempt to enter fullscreen mode.
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
                  <span>Starting {quizType === 'battle' ? 'Battle' : 'Quiz'}...</span>
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