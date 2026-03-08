import React, { lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import './styles/transitions.css';
import './styles/smooth-scroll.css';
import './styles/modern-effects.css';
import { AnimatePresence, motion } from "framer-motion";
import IntroScreen from "./pages/IntroScreen";
import QuizPage from "./pages/QuizPage";
import ResultScreen from "./pages/ResultScreen";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from './components/AdminRoute';
import ExaminerRoute from './components/ExaminerRoute';

// Lazy load heavy components
const QuizBattleRoom = lazy(() => import("./pages/QuizBattleRoom"));
const BattleReview = lazy(() => import("./pages/BattleReview"));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminWhatsApp = lazy(() => import('./pages/AdminWhatsApp'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const ExaminerDashboard = lazy(() => import('./pages/ExaminerDashboard'));
const WrittenExams = lazy(() => import('./pages/WrittenExams'));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const ProgressTracking = lazy(() => import('./pages/ProgressTracking'));
const ProgressEditor = lazy(() => import('./pages/ProgressEditor'));
const SecretChat = lazy(() => import('./pages/SecretChat'));

import UserWhatsApp from './pages/UserWhatsApp';
import UserInbox from './pages/UserInbox';
import Notepad from './pages/Notepad';
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
import { SmoothScrollProvider } from './components/SmoothScrollProvider';
import WhatsNewModal from './components/WhatsNewModal';

// Optional Navbar
import { useState } from "react";
import { FaBars, FaTimes, FaCog, FaPalette } from 'react-icons/fa';

function Navbar() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
  const [isExaminer, setIsExaminer] = React.useState(false);
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
            setIsExaminer(userData.isExaminer === true);
          } else {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setIsExaminer(false);
          }
        } catch (error) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsExaminer(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsExaminer(false);
      }
    }
    
    checkAuth();
    
    window.addEventListener('storage', checkAuth);
    window.addEventListener('userAuthChange', checkAuth);
    window.addEventListener('userRoleUpdate', checkAuth);
    
    // Check for role updates every 30 seconds
    const roleCheckInterval = setInterval(async () => {
      if (secureStorage.getToken()) {
        await secureStorage.refreshUserData();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('userAuthChange', checkAuth);
      window.removeEventListener('userRoleUpdate', checkAuth);
      clearInterval(roleCheckInterval);
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
              <Link to={isAuthenticated ? "/progress" : "/login"} className="text-gray-800 dark:text-white font-semibold hover:text-cyan-600 dark:hover:text-cyan-400 transition">Progress</Link>
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
              {isSuperAdmin && (
                <Link to="/notepad" className="text-gray-800 dark:text-white font-semibold hover:text-green-600 dark:hover:text-green-400 transition">Notepad</Link>
              )}
              {isSuperAdmin && (
                <Link to="/secret-chat" className="text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 transition">🔐 Secret</Link>
              )}
              {isAuthenticated && (
                <Link to="/examiner" className="text-gray-800 dark:text-white font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition">Examiner</Link>
              )}
              {isAuthenticated && (
                <Link to="/written-exams" className="text-gray-800 dark:text-white font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition">Written Exams</Link>
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
                <Link to={isAuthenticated ? "/progress" : "/login"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Progress</Link>
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
                {isSuperAdmin && (
                  <Link to="/notepad" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Notepad</Link>
                )}
                {isSuperAdmin && (
                  <Link to="/secret-chat" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-red-600 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition">🔐 Secret</Link>
                )}
                {isAuthenticated && (
                  <Link to="/examiner" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Examiner</Link>
                )}
                {isAuthenticated && (
                  <Link to="/written-exams" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition">Written Exams</Link>
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
    if (pathname === '/') return 'zoom';
    if (pathname.includes('/quiz') || pathname.includes('/battle')) return 'slideLeft';
    if (pathname.includes('/profile') || pathname.includes('/admin')) return 'slideRight';
    if (pathname.includes('/ai-chat')) return 'rotate';
    if (pathname.includes('/leaderboard') || pathname.includes('/badges')) return 'slideLeft';
    return 'fade';
  };
  
  const transitionVariants = {
    fade: {
      initial: { opacity: 0, filter: 'blur(10px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(10px)' }
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
    },
    zoom: {
      initial: { opacity: 0, scale: 0.5 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.5 }
    },
    rotate: {
      initial: { opacity: 0, rotate: -10, scale: 0.8 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
      exit: { opacity: 0, rotate: 10, scale: 0.8 }
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
          duration: 0.6, 
          ease: [0.34, 1.56, 0.64, 1],
          opacity: { duration: 0.4 },
          scale: { duration: 0.5 },
          filter: { duration: 0.4 },
          x: { duration: 0.5 },
          y: { duration: 0.5 },
          rotate: { duration: 0.5 }
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
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                    <QuizBattleRoom />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/battle-review"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <BattleReview />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <UserProfile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <ProfileEdit />
                </Suspense>
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
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                    <AdminDashboard />
                  </Suspense>
                </ErrorBoundary>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/whatsapp"
            element={
              <AdminRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <AdminWhatsApp />
                </Suspense>
              </AdminRoute>
            }
          />

          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackMessage="SuperAdmin dashboard encountered an error. Please refresh or contact support.">
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                    <SuperAdminDashboard />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/examiner"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <ExaminerDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/written-exams"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <WrittenExams />
                </Suspense>
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
          <Route
            path="/notepad"
            element={
              <ProtectedRoute>
                <Notepad />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secret-chat"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}>
                  <SecretChat />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <ProgressTracking />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress-editor"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div></div>}>
                  <ProgressEditor />
                </Suspense>
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
    countdownData,
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

  // Page transition enhancements and Lenis setup
  React.useEffect(() => {
    // Add Lenis class for smooth scrolling
    document.documentElement.classList.add('lenis');
    
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
      document.documentElement.classList.remove('lenis');
    };
  }, []);

  return (
    <motion.div 
      className="flex flex-col min-h-screen animated-bg transition-colors duration-200"
      style={{
        background: 'linear-gradient(-45deg, #ff6b35, #f7931e, #00d4ff, #00ff88, #ff6b35)',
        backgroundSize: '400% 400%',
        backgroundAttachment: 'fixed',
        animation: 'gradient-shift 8s ease infinite'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <AnimatedRoutes />
      </div>
      
      {/* What's New Modal */}
      <WhatsNewModal />
      
      {/* Onboarding Tour */}
      <OnboardingTour
        shouldShowTour={shouldShowTour}
        setShouldShowTour={setShouldShowTour}
        onTourComplete={markTutorialAsCompleted}
      />
      
      {/* Maintenance System */}
      <MaintenanceNotification
        isVisible={showNotification}
        countdownData={countdownData}
        onComplete={handleNotificationComplete}
      />
      <MaintenanceOverlay isActive={isMaintenanceMode} isSuperAdmin={isSuperAdmin} />
    </motion.div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <NotificationProvider>
          <MathProvider>
            <SmoothScrollProvider>
              <AppContent />
            </SmoothScrollProvider>
          </MathProvider>
        </NotificationProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}