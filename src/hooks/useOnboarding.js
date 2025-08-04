import { useState, useEffect } from 'react';

const TUTORIAL_STORAGE_KEY = 'hasSeenTutorial';

export const useOnboarding = () => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true); // Default to true to prevent flash
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial
    const tutorialStatus = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    const hasSeenIt = tutorialStatus === 'true';
    
    setHasSeenTutorial(hasSeenIt);
    
    // Only show tour if user hasn't seen it and is authenticated
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!hasSeenIt && userData && authToken) {
      // Small delay to ensure components are mounted
      setTimeout(() => {
        setShouldShowTour(true);
      }, 1000);
    }
  }, []);

  const markTutorialAsCompleted = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    setHasSeenTutorial(true);
    setShouldShowTour(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    setHasSeenTutorial(false);
  };

  const startTour = () => {
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