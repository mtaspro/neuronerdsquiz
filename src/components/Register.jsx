import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiHelpers } from '../utils/api';

const Register = () => {
  // Avatar options from ProfileEdit
  const avatarOptions = [
    'https://avatar.iran.liara.run/public/41',
    'https://avatar.iran.liara.run/public/43',
    'https://avatar.iran.liara.run/public/38',
    'https://avatar.iran.liara.run/public/40',
    'https://avatar.iran.liara.run/public/100',
    'https://avatar.iran.liara.run/public/56',
    'https://avatar.iran.liara.run/public/73',
    'https://avatar.iran.liara.run/public/97'
  ];

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    avatar: avatarOptions[0],
    profilePicture: null
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePicture: 'Please select an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePicture: 'Image size must be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setUseCustomImage(true);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, profilePicture: '' }));
    }
  };

  const handleAvatarSelect = (avatarUrl) => {
    setFormData(prev => ({ ...prev, avatar: avatarUrl, profilePicture: null }));
    setPreviewImage('');
    setUseCustomImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validateForm()) return;
    setIsLoading(true);
    
    try {
      console.log('Attempting registration with:', {
        email: formData.email,
        username: formData.username,
        hasPassword: !!formData.password,
        avatar: formData.avatar
      });

      const submitData = new FormData();
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('username', formData.username);
      if (useCustomImage && formData.profilePicture) {
        submitData.append('profilePicture', formData.profilePicture);
      } else {
        submitData.append('avatar', formData.avatar);
      }

      const res = await apiHelpers.register(submitData);

      console.log('Registration response:', res.data);

      if (res.data && res.data.token && res.data.user) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('userData', JSON.stringify({
          ...res.data.user,
          username: formData.username,
          avatar: formData.avatar
        }));
        window.dispatchEvent(new Event('userAuthChange')); // Dispatch event
        navigate('/dashboard');
      } else {
        setServerError('Invalid response from server.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data && error.response.data.error) {
        setServerError(error.response.data.error);
      } else if (error.message) {
        setServerError(`Registration failed: ${error.message}`);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-purple-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white"
          >
            Create Account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300"
          >
            Join Neuronerds Quiz and start learning
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
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm"
            >
              {serverError}
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full max-w-full px-3 py-2 border rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm leading-tight transition-colors ${
                  errors.username 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                className={`appearance-none relative block w-full max-w-full px-3 py-2 border rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm leading-tight transition-colors ${
                  errors.email 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full max-w-full px-3 py-2 border rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm leading-tight transition-colors ${
                  errors.password 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`appearance-none relative block w-full max-w-full px-3 py-2 border rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm leading-tight transition-colors ${
                  errors.confirmPassword 
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Your Avatar
              </label>
              
              {/* Current Selection Preview */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500">
                  <img
                    src={useCustomImage ? previewImage : formData.avatar}
                    alt="Selected avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=User&background=random`;
                    }}
                  />
                </div>
              </div>

              {/* Upload Custom Image */}
              <div className="mb-4">
                <label className="block w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-cyan-400 transition-colors">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      📷 Upload Custom Image
                    </span>
                  </div>
                </label>
                {errors.profilePicture && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.profilePicture}</p>
                )}
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map((avatarUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAvatarSelect(avatarUrl)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                      !useCustomImage && formData.avatar === avatarUrl
                        ? 'border-cyan-500 ring-2 ring-cyan-200 dark:ring-cyan-800'
                        : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                    }`}
                  >
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=User&background=random`;
                      }}
                    />
                    {!useCustomImage && formData.avatar === avatarUrl && (
                      <div className="absolute inset-0 bg-cyan-500 bg-opacity-20 flex items-center justify-center">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default Register;
