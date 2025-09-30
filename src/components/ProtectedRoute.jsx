import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { secureStorage } from '../utils/secureStorage.js';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = secureStorage.getToken();
      
      if (token) {
        try {
          const userData = await secureStorage.getUserData();
          if (userData) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Failed to validate authentication:', error);
          // Clear invalid data
          secureStorage.clear();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Show nothing while checking authentication - let GlobalLoader handle loading state
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
