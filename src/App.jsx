import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import IntroScreen from "./pages/IntroScreen";
import QuizPage from "./pages/QuizPage";
import ResultScreen from "./pages/ResultScreen";
import Leaderboard from "./pages/Leaderboard";
import Dashboard from "./pages/Dashboard";
import QuizBattleRoom from "./pages/QuizBattleRoom";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import DarkModeToggle from './components/DarkModeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationSystem';
import { DarkModeProvider } from './contexts/DarkModeContext';

// Optional Navbar
function Navbar() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    function checkAdmin() {
      const userData = localStorage.getItem('userData');
      const token = localStorage.getItem('authToken');
      
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          // Check both user data and JWT token for admin status
          const isUserAdmin = user.isAdmin === true;
          setIsAdmin(isUserAdmin);
          console.log('Admin check - User data:', user, 'Is admin:', isUserAdmin);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }
    
    checkAdmin();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAdmin);
    
    // Also listen for custom events (when user logs in/out in same tab)
    window.addEventListener('userAuthChange', checkAdmin);
    
    return () => {
      window.removeEventListener('storage', checkAdmin);
      window.removeEventListener('userAuthChange', checkAdmin);
    };
  }, []);
  
  return (
    <nav className="w-full bg-white dark:bg-gray-900 py-3 px-4 flex justify-center items-center gap-4 shadow-md z-20 border-b border-gray-200 dark:border-gray-700">
      <Link to="/" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Intro</Link>
      <Link to="/quiz" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Quiz</Link>
      <Link to="/result" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Result</Link>
      <Link to="/leaderboard" className="text-gray-800 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition">Leaderboard</Link>
      {isAdmin && (
        <Link to="/admin" className="text-gray-800 dark:text-white font-semibold hover:text-pink-600 dark:hover:text-pink-400 transition">Admin</Link>
      )}
      <div className="ml-auto">
        <DarkModeToggle />
      </div>
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

export default function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <NotificationProvider>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
            <Navbar />
            <AnimatedRoutes />
          </div>
        </NotificationProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}
