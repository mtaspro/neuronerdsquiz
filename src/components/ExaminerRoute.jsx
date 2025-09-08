import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { secureStorage } from '../utils/secureStorage.js';

const ExaminerRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkExaminerAccess = async () => {
      try {
        const token = secureStorage.getToken();
        if (!token) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const userData = await secureStorage.getUserData();
        if (userData && (userData.isExaminer || userData.isAdmin || userData.isSuperAdmin)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking examiner access:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkExaminerAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ExaminerRoute;