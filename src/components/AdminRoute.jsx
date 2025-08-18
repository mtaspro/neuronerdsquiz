import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { secureStorage } from '../utils/secureStorage.js';

const AdminRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = async () => {
      const token = secureStorage.getToken();
      
      if (token) {
        try {
          const userData = await secureStorage.getUserData();
          
          if (userData) {
            setIsAuthenticated(true);
            setIsAdmin(userData.isAdmin === true);
          } else {
            setIsAuthenticated(false);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          secureStorage.clear();
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAdminAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full"
          />
          <p className="text-white text-lg">Verifying admin access...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied if authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <motion.div
          className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            You don't have administrator privileges to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  // Render admin content if authenticated and admin
  return children;
};

export default AdminRoute;
