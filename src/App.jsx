import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
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
import AdminDashboard from './pages/AdminDashboard';

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
    <nav className="w-full bg-gray-900 py-3 px-4 flex justify-center gap-4 shadow-md z-20">
      <Link to="/" className="text-white font-semibold hover:text-blue-400 transition">Intro</Link>
      <Link to="/quiz" className="text-white font-semibold hover:text-blue-400 transition">Quiz</Link>
      <Link to="/result" className="text-white font-semibold hover:text-blue-400 transition">Result</Link>
      <Link to="/leaderboard" className="text-white font-semibold hover:text-blue-400 transition">Leaderboard</Link>
      {isAdmin && (
        <Link to="/admin" className="text-white font-semibold hover:text-pink-400 transition">Admin</Link>
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
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
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
    <div className="flex flex-col min-h-screen bg-gray-950">
      <Navbar />
      <AnimatedRoutes />
    </div>
  );
}
