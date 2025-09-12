import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import LoadingAnimation from './LoadingAnimation';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        setMessage('Password reset link sent to your email!');
      } else {
        setMessage(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl"
    >
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
      >
        <FaArrowLeft />
        <span>Back to Login</span>
      </button>

      <div className="text-center mb-8">
        <FaEnvelope className="text-4xl text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Forgot Password?</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Enter your email to receive a password reset link
        </p>
      </div>

      {!isSuccess ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {isLoading ? <LoadingAnimation size="small" /> : 'Login with Email'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-green-600 dark:text-green-400 font-semibold">
            Login successful! Redirecting to dashboard...
          </p>
        </div>
      )}

      {message && !isSuccess && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {message}
        </div>
      )}
    </motion.div>
  );
};

export default ForgotPassword;