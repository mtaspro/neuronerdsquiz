import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiHelpers } from '../utils/api';
import useTypingSound from '../hooks/useTypingSound';
import soundManager from '../utils/soundUtils';
import { secureStorage } from '../utils/secureStorage.js';
import LoadingAnimation from '../components/LoadingAnimation';
import ForgotPassword from './ForgotPassword';
import PageShell from './ui/PageShell';
import Button from './ui/Button';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { handleKeyDown } = useTypingSound();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    soundManager.play('formSubmit');
    setServerError('');
    if (!validateForm()) return;
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { email: formData.email });

      const res = await apiHelpers.login({
        email: formData.email,
        password: formData.password
      });

      console.log('Login response:', res.data);

      if (res.data && res.data.token && res.data.user) {
        soundManager.play('success');
        secureStorage.setToken(res.data.token);
        secureStorage.setUserData(res.data.user);
        // Dispatch custom event to update navbar
        window.dispatchEvent(new Event('userAuthChange'));
        navigate('/dashboard');
      } else {
        soundManager.play('error');
        setServerError('Invalid response from server.');
      }
    } catch (error) {
      console.error('Login error:', error);
      soundManager.play('error');
      
      if (error.response && error.response.data && error.response.data.error) {
        setServerError(error.response.data.error);
      } else if (error.message) {
        setServerError(`Login failed: ${error.message}`);
      } else {
        setServerError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    window.dispatchEvent(new Event('userAuthChange'));
    navigate('/dashboard');
  };

  if (showForgotPassword) {
    return (
      <PageShell padding="py-12 flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <ForgotPassword 
          onBack={() => setShowForgotPassword(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
      </PageShell>
    );
  }

  return (
    <PageShell padding="py-12 flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full"
      >
      <motion.div
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="aura-glass p-8 sm:p-10 space-y-8"
      >
        <div>
          <p className="aura-label text-center mb-2">Secure access</p>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center aura-headline text-2xl sm:text-3xl"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-center aura-subhead text-sm"
          >
            Sign in to continue your learning journey
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-6 max-w-sm mx-auto px-4 sm:px-0"
          onSubmit={handleSubmit}
        >
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm"
            >
              {serverError}
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="aura-label block mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`aura-input ${errors.email ? 'aura-input-error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="aura-label block mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={`aura-input ${errors.password ? 'aura-input-error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-cyan-500 focus:ring-cyan-500/50 border-cyan-500/30 rounded bg-black/40"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-400">
                Remember me
              </label>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingAnimation size="small" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-cyan-400/90 hover:text-cyan-300 font-medium transition-colors"
            >
              Forgot your password?
            </button>
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </motion.form>
      </motion.div>
      </motion.div>
    </PageShell>
  );
};

export default Login;
