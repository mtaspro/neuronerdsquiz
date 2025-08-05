import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import IntroScreen from "./pages/IntroScreen";
import QuizPage from "./pages/QuizPage";
import ResultScreen from "./pages/ResultScreen";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import QuizBattleRoom from "./pages/QuizBattleRoom";
import ProfileEdit from "./pages/ProfileEdit";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import Badges from './pages/Badges';
import About from './pages/About';
import NeuraflowAIChat from './pages/NeuraflowAIChat';
import DarkModeToggle from './components/DarkModeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { DarkModeProvider } from './contexts/DarkModeContext';
import OnboardingTour from './components/OnboardingTour';
import { useOnboarding } from './hooks/useOnboarding';
import { MathProvider } from './components/MathText';

// Optional Navbar
import { useState } from "react";

function Navbar() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  React.useEffect(() => {
    function checkAdmin() {
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          const isUserAdmin = user.isAdmin === true;
          setIsAdmin(isUserAdmin);
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }
    
    checkAdmin();
    
    window.addEventListener('storage', checkAdmin);
    window.addEventListener('userAuthChange', checkAdmin);
    
    return () => {
      window.removeEventListener('storage', checkAdmin);
      window.removeEventListener('userAuthChange', checkAdmin);
    };
  }, []);

  return (
    <nav className="w-full bg-white dark:bg-gray-900 shadow-md z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex md:space-x-4">
              <Link to="/" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Home</Link>
              <Link to="/dashboard" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Dashboard</Link>
              <Link to="/leaderboard" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Leaderboard</Link>
              <Link to="/badges" className="text-gray-800 dark:text-white font-semibold hover:text-yellow-600 dark:hover:text-yellow-400 transition">Badges</Link>
              <Link to="/about" className="text-gray-800 dark:text-white font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition">About</Link>
              <Link to="/ai-chat" className="text-gray-800 dark:text-white font-semibold hover:text-green-600 dark:hover:text-green-400 transition">AI Chat</Link>
              {isAdmin && (
                <Link to="/admin" className="text-gray-800 dark:text-white font-semibold hover:text-pink-600 dark:hover:text-pink-400 transition">Admin</Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden md:block">
              <DarkModeToggle />
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Home</Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Dashboard</Link>
              <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Leaderboard</Link>
              <Link to="/badges" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Badges</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">About</Link>
              <Link to="/ai-chat" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">AI Chat</Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">Admin</Link>
              )}
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                <DarkModeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// Animated route transitions
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 min-h-0"
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
                <QuizBattleRoom />
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
                <AdminDashboard />
              </AdminRoute>
            }
          />
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Navbar />
      <AnimatedRoutes />
      
      {/* Onboarding Tour */}
      <OnboardingTour
        shouldShowTour={shouldShowTour}
        setShouldShowTour={setShouldShowTour}
        onTourComplete={markTutorialAsCompleted}
      />
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