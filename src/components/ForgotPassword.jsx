import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import LoadingAnimation from './LoadingAnimation';
import Button from './ui/Button';

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
        setMessage('Login successful! Redirecting...');
        
        // Import secureStorage dynamically
        const { secureStorage } = await import('../utils/secureStorage');
        
        // Store token and user data using secureStorage
        secureStorage.setToken(data.token);
        secureStorage.setUserData(data.user);
        
        // Force full page reload to dashboard
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 1000);
      } else {
        setMessage(data.message || 'Email not found');
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
      className="max-w-md mx-auto aura-glass p-8"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <FaArrowLeft />
        <span>Back to Login</span>
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto mb-4">
          <FaEnvelope className="text-2xl text-cyan-400" />
        </div>
        <h2 className="aura-headline text-2xl">Forgot Password?</h2>
        <p className="aura-subhead mt-2">
          Enter your email to login without password
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
              className="aura-input"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <LoadingAnimation size="small" /> : 'Login with Email'}
          </Button>
        </form>
      ) : (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-emerald-400 font-semibold">
            Login successful! Redirecting to dashboard...
          </p>
        </div>
      )}

      {message && !isSuccess && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {message}
        </div>
      )}
    </motion.div>
  );
};

export default ForgotPassword;