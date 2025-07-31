import React, { lazy } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load components for better performance
export const LazyIntroScreen = lazy(() => import('../pages/IntroScreen'));
export const LazyQuizPage = lazy(() => import('../pages/QuizPage'));
export const LazyResultScreen = lazy(() => import('../pages/ResultScreen'));
export const LazyLeaderboard = lazy(() => import('../pages/Leaderboard'));
export const LazyDashboard = lazy(() => import('../pages/Dashboard'));
export const LazyQuizBattleRoom = lazy(() => import('../pages/QuizBattleRoom'));
export const LazyAdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const LazyLogin = lazy(() => import('../components/Login'));
export const LazyRegister = lazy(() => import('../components/Register'));

// Preload components for better UX
export const preloadComponent = (componentImport) => {
  const componentImporter = typeof componentImport === 'function' 
    ? componentImport 
    : () => componentImport;
  
  return componentImporter();
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('../pages/Dashboard'));
  preloadComponent(() => import('../pages/QuizPage'));
  preloadComponent(() => import('../pages/Leaderboard'));
};

// Component with loading fallback
export const withLoadingFallback = (Component, fallback = null) => {
  return (props) => (
    <React.Suspense fallback={fallback || <LoadingSpinner fullScreen={true} />}>
      <Component {...props} />
    </React.Suspense>
  );
};

export default {
  LazyIntroScreen,
  LazyQuizPage,
  LazyResultScreen,
  LazyLeaderboard,
  LazyDashboard,
  LazyQuizBattleRoom,
  LazyAdminDashboard,
  LazyLogin,
  LazyRegister,
  preloadComponent,
  preloadCriticalComponents,
  withLoadingFallback
};