import { useState, useEffect } from 'react';

const TUTORIAL_STORAGE_KEY = 'hasSeenTutorial';

export const useOnboarding = () => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(null); // Start with null to check properly
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    const checkAndStartTour = () => {
      // Check if user has seen the tutorial
      const tutorialStatus = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      const hasSeenIt = tutorialStatus === 'true';
      
      console.log('🎯 Onboarding Check:', { tutorialStatus, hasSeenIt });
      
      setHasSeenTutorial(hasSeenIt);
      
      // Only show tour if user hasn't seen it and is authenticated
      const userData = localStorage.getItem('userData');
      const authToken = localStorage.getItem('authToken');
      
      console.log('🔐 Auth Check:', { userData: !!userData, authToken: !!authToken });
      
      if (!hasSeenIt && userData && authToken) {
        console.log('🚀 Starting onboarding tour...');
        // Small delay to ensure components are mounted
        setTimeout(() => {
          setShouldShowTour(true);
        }, 3000); // Increased delay to ensure all components are ready
      }
    };

    // Initial check
    checkAndStartTour();

    // Listen for auth changes (when user registers/logs in)
    const handleAuthChange = () => {
      console.log('🔄 Auth change detected, rechecking onboarding...');
      setTimeout(checkAndStartTour, 1000); // Delay to ensure localStorage is updated
    };

    window.addEventListener('userAuthChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('userAuthChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const markTutorialAsCompleted = () => {
    console.log('✅ Marking tutorial as completed');
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setHasSeenTutorial(true);
    setShouldShowTour(false);
  };

  const resetTutorial = () => {
    console.log('🔄 Resetting tutorial');
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setHasSeenTutorial(false);
  };

  const startTour = () => {
    console.log('🎬 Manually starting tour');
    setShouldShowTour(true);
  };

  return {
    hasSeenTutorial,
    shouldShowTour,
    setShouldShowTour,
    markTutorialAsCompleted,
    resetTutorial,
    startTour
  };
};