import React from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';

const OnboardingTour = ({ 
  shouldShowTour, 
  setShouldShowTour, 
  onTourComplete 
}) => {
  const location = useLocation();

  // Define tour steps based on current page
  const getDashboardSteps = () => [
    {
      target: '.welcome-section',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">🎉 Welcome to NeuroNerds Quiz!</h3>
          <p>Let's take a quick tour to help you get started with our interactive quiz platform.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.chapter-selection',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">📚 Choose Your Chapter</h3>
          <p>Select from various quiz topics. Each chapter contains multiple questions to test your knowledge.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.start-quiz-btn',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">🚀 Start Your Quiz</h3>
          <p>Click here to begin a quiz on your selected chapter. You'll face timed questions with multiple choice answers.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.battle-section',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">⚔️ Quiz Battles</h3>
          <p>Challenge friends in real-time quiz battles! Create a room or join an existing one for competitive fun.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.leaderboard-link',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">🏆 Leaderboard</h3>
          <p>Check your ranking against other players. Compete for the top spots and track your progress!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.badges-link',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">🎯 Badge System</h3>
          <p>Earn competitive badges by excelling in different areas: speed, accuracy, battles, and more!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.profile-section',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">👤 Your Profile</h3>
          <p>View your stats, edit your profile, and track your quiz history and achievements.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.dark-mode-toggle',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">🌙 Dark Mode</h3>
          <p>Toggle between light and dark themes for a comfortable viewing experience.</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const getGeneralSteps = () => [
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">🎉 Welcome to NeuroNerds Quiz!</h3>
          <p>Navigate to the Dashboard to start your quiz journey and explore all features!</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  // Get appropriate steps based on current location
  const getSteps = () => {
    if (location.pathname === '/dashboard') {
      return getDashboardSteps();
    }
    return getGeneralSteps();
  };

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update state to advance the tour
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour completed or skipped
      setShouldShowTour(false);
      onTourComplete();
    }
  };

  const tourStyles = {
    options: {
      primaryColor: '#3b82f6',
      textColor: '#374151',
      backgroundColor: '#ffffff',
      overlayColor: 'rgba(0, 0, 0, 0.4)',
      spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: 12,
      padding: 20,
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    tooltipContent: {
      fontSize: '14px',
      lineHeight: '1.5',
    },
    buttonNext: {
      backgroundColor: '#3b82f6',
      borderRadius: 8,
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '600',
    },
    buttonBack: {
      color: '#6b7280',
      marginRight: 'auto',
      padding: '8px 16px',
      fontSize: '14px',
    },
    buttonSkip: {
      color: '#6b7280',
      fontSize: '14px',
    },
    beacon: {
      inner: '#3b82f6',
      outer: '#3b82f6',
    },
  };

  if (!shouldShowTour) return null;

  return (
    <Joyride
      steps={getSteps()}
      run={shouldShowTour}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={tourStyles}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Got it! 🎉',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
      disableOverlayClose={true}
      disableScrollParentFix={true}
      spotlightClicks={false}
      hideCloseButton={false}
    />
  );
};

export default OnboardingTour;