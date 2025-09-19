import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { secureStorage } from '../utils/secureStorage.js';

const ExaminerRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExaminer, setIsExaminer] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = secureStorage.getToken();
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const userData = await secureStorage.getUserData();
        if (userData) {
          setIsAuthenticated(true);
          setIsExaminer(userData.isExaminer || userData.isAdmin || userData.isSuperAdmin);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ExaminerRoute;