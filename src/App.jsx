import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import './styles/transitions.css';
import { AnimatePresence, motion } from "framer-motion";
import IntroScreen from "./pages/IntroScreen";
import QuizPage from "./pages/QuizPage";
import ResultScreen from "./pages/ResultScreen";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import QuizBattleRoom from "./pages/QuizBattleRoom";
import ProfileEdit from "./pages/ProfileEdit";
import UserProfile from "./pages/UserProfile";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import AdminWhatsApp from './pages/AdminWhatsApp';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

import UserWhatsApp from './pages/UserWhatsApp';
import UserInbox from './pages/UserInbox';
import NotFound from './pages/NotFound';
import Badges from './pages/Badges';
import About from './pages/About';
import NeuraflowAIChat from './pages/NeuraflowAIChat';
import SharedConversation from './pages/SharedConversation';
import DarkModeToggle from './components/DarkModeToggle';
import ThemeSelector from './components/ThemeSelector';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { DarkModeProvider } from './contexts/DarkModeContext';
import OnboardingTour from './components/OnboardingTour';
import { useOnboarding } from './hooks/useOnboarding';
import { MathProvider } from './components/MathText';
import soundManager from './utils/soundUtils';
import { secureStorage } from './utils/secureStorage.js';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import MaintenanceNotification from './components/MaintenanceNotification';
import { useMaintenance } from './hooks/useMaintenance';

// Optional Navbar
import { useState } from "react";
import { FaBars, FaTimes, FaCog, FaPalette } from 'react-icons/fa';

function Navbar() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('selectedTheme') || 'tech-bg';
  });

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('selectedTheme', theme);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
  };
  
  React.useEffect(() => {
    async function checkAuth() {
      const token = secureStorage.getToken();
      
      if (token) {
        try {
          const userData = await secureStorage.getUserData();
          if (userData) {
            setIsAuthenticated(true);
            setIsAdmin(userData.isAdmin === true);
            setIsSuperAdmin(userData.isSuperAdmin === true);
          } else {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        } catch (error) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    }
    
    checkAuth();
    
    window.addEventListener('storage', checkAuth);
    window.addEventListener('userAuthChange', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userAuthChange', checkAuth);
    };
  }, []);

  return (
    <nav className="w-full bg-white dark:bg-gray-900 shadow-md z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center space-x-4">
            {/* Settings Button - Desktop Only */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                aria-label="Settings"
              >
                <FaCog className="h-5 w-5" />
              </button>
              {/* Settings Dropdown */}
              {settingsOpen && (
                <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-48 z-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                      <DarkModeToggle />
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <button
                        onClick={() => {
                          setThemeModalOpen(true);
                          setSettingsOpen(false);
                        }}
                        className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-full p-2 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all group"
                        title="Change Theme"
                      >
                        <FaPalette className="text-lg text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden lg:flex lg:space-x-4">
              <Link to="/" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Home</Link>
              <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Dashboard</Link>
              <Link to={isAuthenticated ? "/leaderboard" : "/login"} className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Leaderboard</Link>
              <Link to={isAuthenticated ? "/badges" : "/login"} className="text-gray-800 dark:text-white font-semibold hover:text-yellow-600 dark:hover:text-yellow-400 transition">Badges</Link>
              <Link to="/about" className="text-gray-800 dark:text-white font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition">About</Link>
              <Link to={isAuthenticated ? "/ai-chat" : "/login"} className="relative text-gray-800 dark:text-white font-bold hover:text-green-600 dark:hover:text-green-400 transition-all duration-300 transform hover:scale-105 px-3 py-1 rounded-lg bg-gradient-to-r from-green-400/10 to-blue-500/10 hover:from-green-400/20 hover:to-blue-500/20 border border-green-400/20 hover:border-green-400/40 shadow-sm hover:shadow-md animate-pulse">
                <span className="relative z-10">NeuraX</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-blue-500/5 rounded-lg blur-sm"></div>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-800 dark:text-white font-semibold hover:text-pink-600 dark:hover:text-pink-400 transition">Admin</Link>
              )}
              {isSuperAdmin && (
                <Link to="/superadmin" className="text-gray-800 dark:text-white font-semibold hover:text-red-600 dark:hover:text-red-400 transition">SuperAdmin</Link>
              )}
            </div>
          </div>
          {/* Mobile Menu Button - Top Right */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 right-0 w-80 max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg h-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="space-y-2">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Home</Link>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Dashboard</Link>
                <Link to={isAuthenticated ? "/leaderboard" : "/login"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Leaderboard</Link>
                <Link to={isAuthenticated ? "/badges" : "/login"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Badges</Link>
                <Link to="/about" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">About</Link>
                <Link to={isAuthenticated ? "/ai-chat" : "/login"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-gray-800 dark:text-white hover:bg-gradient-to-r hover:from-green-400/20 hover:to-blue-500/20 transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-green-400/10 to-blue-500/10 border border-green-400/20 animate-pulse">
                  <span className="relative z-10">NeuraX</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Admin</Link>
                )}
                {isSuperAdmin && (
                  <Link to="/superadmin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">SuperAdmin</Link>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                  <DarkModeToggle />
                </div>
                <button
                  onClick={() => {
                    setThemeModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-full p-2 hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all group mx-auto"
                  title="Change Theme"
                >
                  <FaPalette className="text-lg text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Theme Selector Modal */}
      <ThemeSelector
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </nav>
  );
}

// Advanced animated route transitions
function AnimatedRoutes() {
  const location = useLocation();
  
  // Different transition variants for different routes
  const getTransitionVariant = (pathname) => {
    if (pathname === '/') return 'slideUp';
    if (pathname.includes('/quiz') || pathname.includes('/battle')) return 'slideLeft';
    if (pathname.includes('/profile') || pathname.includes('/admin')) return 'slideRight';
    if (pathname.includes('/ai-chat')) return 'fadeScale';
    return 'fade';
  };
  
  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 50, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -50, scale: 1.05 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 100, rotateY: -15 },
      animate: { opacity: 1, x: 0, rotateY: 0 },
      exit: { opacity: 0, x: -100, rotateY: 15 }
    },
    slideRight: {
      initial: { opacity: 0, x: -100, rotateY: 15 },
      animate: { opacity: 1, x: 0, rotateY: 0 },
      exit: { opacity: 0, x: 100, rotateY: -15 }
    },
    fadeScale: {
      initial: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
      animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, scale: 1.2, filter: 'blur(10px)' }
    }
  };
  
  const variant = getTransitionVariant(location.pathname);
  const transition = transitionVariants[variant];
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
        transition={{ 
          duration: 0.5, 
          ease: [0.25, 0.46, 0.45, 0.94],
          opacity: { duration: 0.3 },
          scale: { duration: 0.4 },
          filter: { duration: 0.3 }
        }}
        className="flex-1 min-h-0 page-transition"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Routes location={location}>
          <Route path="/" element={<IntroScreen />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultScreen />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/ai-chat" element={<NeuraflowAIChat />} />
          <Route path="/share/:shareId" element={<SharedConversation />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/battle/:roomId"
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackMessage="Battle room encountered an error. Please refresh or rejoin the battle.">
                  <QuizBattleRoom />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/badges"
            element={
              <ProtectedRoute>
                <Badges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <ErrorBoundary fallbackMessage="Admin dashboard encountered an error. Please refresh or contact support.">
                  <AdminDashboard />
                </ErrorBoundary>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/whatsapp"
            element={
              <AdminRoute>
                <AdminWhatsApp />
              </AdminRoute>
            }
          />

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackMessage="SuperAdmin dashboard encountered an error. Please refresh or contact support.">
                  <SuperAdminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/whatsapp"
            element={
              <ProtectedRoute>
                <UserWhatsApp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <UserInbox />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const {
    shouldShowTour,
    setShouldShowTour,
    markTutorialAsCompleted
  } = useOnboarding();

  const {
    isMaintenanceMode,
    showNotification,
    handleNotificationComplete,
    isSuperAdmin
  } = useMaintenance();

  // Add global click listener to start background music on user interaction
  React.useEffect(() => {
    const handleUserInteraction = () => {
      soundManager.startMusicOnInteraction();
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Smooth scroll behavior and page transition enhancements
  React.useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Preload critical animations
    const preloadAnimations = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = 'https://lottie.host/b39f8f87-3d0d-4751-ba62-9274ac09b80d/5CTRzY4AI4.json';
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };
    
    preloadAnimations();
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <motion.div 
      className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <AnimatedRoutes />
      </div>
      
      {/* Onboarding Tour */}
      <OnboardingTour
        shouldShowTour={shouldShowTour}
        setShouldShowTour={setShouldShowTour}
        onTourComplete={markTutorialAsCompleted}
      />
      
      {/* Maintenance System */}
      <MaintenanceNotification
        isVisible={showNotification}
        onComplete={handleNotificationComplete}
      />
      <MaintenanceOverlay isActive={isMaintenanceMode} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <NotificationProvider>
          <MathProvider>
            <AppContent />
          </MathProvider>
        </NotificationProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}