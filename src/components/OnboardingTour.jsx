import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const OnboardingTour = ({ 
  shouldShowTour, 
  setShouldShowTour, 
  onTourComplete 
}) => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);

  // Define tour steps based on current page
  const getDashboardSteps = () => [
    {
      target: '.welcome-section',
      title: '🎉 Welcome to NeuroNerds Quiz!',
      content: 'Let\'s take a quick tour to help you get started with our interactive quiz platform.',
      placement: 'center',
    },
    {
      target: '.chapter-selection',
      title: '📚 Choose Your Chapter',
      content: 'Select from various quiz topics. Each chapter contains multiple questions to test your knowledge.',
      placement: 'bottom',
    },
    {
      target: '.start-quiz-btn',
      title: '🚀 Start Your Quiz',
      content: 'Click here to begin a quiz on your selected chapter. You\'ll face timed questions with multiple choice answers.',
      placement: 'top',
    },
    {
      target: '.battle-section',
      title: '⚔️ Quiz Battles',
      content: 'Challenge friends in real-time quiz battles! Create a room or join an existing one for competitive fun.',
      placement: 'top',
    },
    {
      target: '.leaderboard-link',
      title: '🏆 Leaderboard',
      content: 'Check your ranking against other players. Compete for the top spots and track your progress!',
      placement: 'bottom',
    },
    {
      target: '.badges-link',
      title: '🎯 Badge System',
      content: 'Earn competitive badges by excelling in different areas: speed, accuracy, battles, and more!',
      placement: 'bottom',
    },
    {
      target: '.profile-section',
      title: '👤 Your Profile',
      content: 'View your stats, edit your profile, and track your quiz history and achievements.',
      placement: 'left',
    },
    {
      target: '.dark-mode-toggle',
      title: '🌙 Dark Mode',
      content: 'Toggle between light and dark themes for a comfortable viewing experience.',
      placement: 'bottom',
    },
  ];

  const getGeneralSteps = () => [
    {
      target: 'body',
      title: '🎉 Welcome to NeuroNerds Quiz!',
      content: 'Navigate to the Dashboard to start your quiz journey and explore all features!',
      placement: 'center',
    },
  ];

  // Get appropriate steps based on current location
  const getSteps = () => {
    if (location.pathname === '/dashboard') {
      return getDashboardSteps();
    }
    return getGeneralSteps();
  };

  const steps = getSteps();

  // Find target element
  useEffect(() => {
    if (shouldShowTour && steps[currentStep]) {
      const target = steps[currentStep].target;
      if (target === 'body') {
        setTargetElement(document.body);
      } else {
        const element = document.querySelector(target);
        setTargetElement(element);
      }
    }
  }, [shouldShowTour, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setShouldShowTour(false);
    setCurrentStep(0);
    onTourComplete();
  };

  // Calculate tooltip position with viewport bounds checking
  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = targetElement.getBoundingClientRect();
    const placement = steps[currentStep]?.placement || 'bottom';
    const tooltipWidth = 320; // w-80 = 320px
    const tooltipHeight = 200; // approximate height
    const margin = 20;

    let position = {};

    switch (placement) {
      case 'top':
        position = {
          top: Math.max(margin, rect.top - tooltipHeight - margin),
          left: Math.min(Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2), window.innerWidth - tooltipWidth - margin),
          transform: 'translate(0, 0)',
        };
        break;
      case 'bottom':
        position = {
          top: Math.min(rect.bottom + margin, window.innerHeight - tooltipHeight - margin),
          left: Math.min(Math.max(margin, rect.left + rect.width / 2 - tooltipWidth / 2), window.innerWidth - tooltipWidth - margin),
          transform: 'translate(0, 0)',
        };
        break;
      case 'left':
        position = {
          top: Math.min(Math.max(margin, rect.top + rect.height / 2 - tooltipHeight / 2), window.innerHeight - tooltipHeight - margin),
          left: Math.max(margin, rect.left - tooltipWidth - margin),
          transform: 'translate(0, 0)',
        };
        break;
      case 'right':
        position = {
          top: Math.min(Math.max(margin, rect.top + rect.height / 2 - tooltipHeight / 2), window.innerHeight - tooltipHeight - margin),
          left: Math.min(rect.right + margin, window.innerWidth - tooltipWidth - margin),
          transform: 'translate(0, 0)',
        };
        break;
      case 'center':
      default:
        position = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
        break;
    }

    return position;
  };

  // Get spotlight position
  const getSpotlightStyle = () => {
    if (!targetElement || steps[currentStep]?.target === 'body') {
      return {};
    }

    const rect = targetElement.getBoundingClientRect();
    return {
      clipPath: `circle(${Math.max(rect.width, rect.height) / 2 + 10}px at ${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px)`,
    };
  };

  if (!shouldShowTour) return null;

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-all duration-300"
          style={getSpotlightStyle()}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-xs sm:max-w-sm w-72 sm:w-80 z-[10001]"
          style={getTooltipPosition()}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Skip Tour
              </button>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              ← Back
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Got it! 🎉' : 'Next →'}
            </button>
          </div>
        </motion.div>

        {/* Beacon for target element */}
        {targetElement && steps[currentStep]?.target !== 'body' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute pointer-events-none z-[10002]"
            style={{
              top: targetElement.getBoundingClientRect().top + targetElement.getBoundingClientRect().height / 2,
              left: targetElement.getBoundingClientRect().left + targetElement.getBoundingClientRect().width / 2,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping absolute" />
              <div className="w-6 h-6 bg-blue-500 rounded-full" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;