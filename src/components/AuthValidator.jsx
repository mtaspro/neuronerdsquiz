import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authUtils } from '../utils/authUtils';
import LoadingSpinner from './LoadingSpinner';

const AuthValidator = ({ children, requireAuth = true, requireAdmin = false }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    validateAuth();
  }, []);

  const validateAuth = async () => {
    try {
      setIsValidating(true);
      setError(null);

      if (!requireAuth) {
        setIsValidating(false);
        return;
      }

      const validation = await authUtils.validateToken();
      
      if (!validation.valid) {
        console.log('🚨 Authentication failed:', validation.error);
        
        // Clear invalid auth data
        authUtils.clearAuth();
        
        // Show specific error messages
        if (validation.userDeleted) {
          setError('Your account has been deleted. Please contact support if this is an error.');
        } else if (validation.invalidToken || validation.tokenExpired) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Authentication failed. Please log in again.');
        }
        
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Authentication successful
      setIsAuthenticated(true);
      setIsAdmin(validation.user?.isAdmin === true);
      
      // Update user data in localStorage
      if (validation.user) {
        localStorage.setItem('userData', JSON.stringify(validation.user));
      }

      // Check admin requirement
      if (requireAdmin && !validation.user?.isAdmin) {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
        setIsValidating(false);
        return;
      }

      setIsValidating(false);
      
    } catch (error) {
      console.error('Auth validation error:', error);
      setError('Network error. Please check your connection and try again.');
      setIsAuthenticated(false);
      setIsValidating(false);
      
      // Redirect to login on network error
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  // Show loading spinner during validation
  if (isValidating) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        text="Validating authentication..." 
        size="large" 
        color="cyan" 
      />
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-4">🚨</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to login page...
          </div>
        </div>
      </div>
    );
  }

  // Show content if authentication is not required or user is authenticated
  if (!requireAuth || isAuthenticated) {
    return children;
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-800 dark:text-white text-xl">
          Access denied. Please log in.
        </div>
      </div>
    </div>
  );
};

export default AuthValidator;