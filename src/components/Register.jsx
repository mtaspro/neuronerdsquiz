import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiHelpers } from '../utils/api';
import { secureStorage } from '../utils/secureStorage.js';
import LoadingAnimation from '../components/LoadingAnimation';
import PageShell from './ui/PageShell';
import Button from './ui/Button';

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
    phoneNumber: '',
    avatar: avatarOptions[0],
    profilePicture: null,
    gender: ''
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
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'WhatsApp number is required';
    } else if (!/^01[0-9]{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 11-digit number (01XXXXXXXXX)';
    }
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
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
      submitData.append('phoneNumber', `880${formData.phoneNumber.substring(1)}`);
      submitData.append('gender', formData.gender);
      if (useCustomImage && formData.profilePicture) {
        submitData.append('profilePicture', formData.profilePicture);
      } else {
        submitData.append('avatar', formData.avatar);
      }

      const res = await apiHelpers.register(submitData);

      console.log('Registration response:', res.data);

      if (res.data && res.data.token && res.data.user) {
        secureStorage.setToken(res.data.token);
        secureStorage.setUserData({
          ...res.data.user,
          username: formData.username,
          avatar: formData.avatar
        });
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
          <p className="aura-label text-center mb-2">New member</p>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center aura-headline text-2xl sm:text-3xl"
          >
            Create Account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-3 text-center aura-subhead text-sm"
          >
            Join HSCAura and enter the arena
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
              <label htmlFor="username" className="aura-label block mb-2">
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
                className={`aura-input ${errors.username ? 'aura-input-error' : ''}`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="aura-label block mb-2">
                WhatsApp Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm">
                  +880
                </span>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className={`flex-1 rounded-r-md aura-input ${errors.phoneNumber ? 'aura-input-error' : ''}`}
                  placeholder="01XXXXXXXXX"
                  maxLength="11"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phoneNumber}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Enter your 11-digit mobile number (e.g., 01712345678)
              </p>
            </div>

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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`aura-input ${errors.password ? 'aura-input-error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="aura-label block mb-2">
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
                className={`aura-input ${errors.confirmPassword ? 'aura-input-error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="aura-label block mb-2">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={formData.gender}
                onChange={handleInputChange}
                className={`aura-input ${errors.gender ? 'aura-input-error' : ''}`}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.gender}</p>
              )}
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="aura-label block mb-3">
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
                  <div className="w-full px-4 py-2 border-2 border-dashed border-cyan-500/30 rounded-lg text-center cursor-pointer hover:border-cyan-400 transition-colors">
                    <span className="text-sm text-slate-300">
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
                        ? 'border-cyan-500 ring-2 ring-cyan-400/30'
                        : 'border-cyan-500/20 hover:border-cyan-400'
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
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingAnimation size="small" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </motion.form>
      </motion.div>
      </motion.div>
    </PageShell>
  );
};

export default Register;
