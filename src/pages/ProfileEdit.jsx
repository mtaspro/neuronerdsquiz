import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaUser, FaCamera, FaUpload, FaSave, FaArrowLeft } from 'react-icons/fa';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';

const ProfileEdit = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: '',
    profilePicture: null
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [useCustomImage, setUseCustomImage] = useState(false);
  const navigate = useNavigate();

  // Predefined avatar options
  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Snuggles&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Princess&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigger&backgroundColor=c7ecee',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Chester&backgroundColor=ffeaa7',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Mittens&backgroundColor=fab1a0'
  ];

  useEffect(() => {
    // Load current user data
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData._id) {
      setFormData(prev => ({
        ...prev,
        username: userData.username || '',
        email: userData.email || '',
        avatar: userData.avatar || avatarOptions[0]
      }));
      
      // Use the avatar utility to get the correct URL for display
      const avatarUrl = getAvatarUrl(userData.avatar || avatarOptions[0]);
      setPreviewImage(avatarUrl);
      setUseCustomImage(!avatarOptions.includes(userData.avatar || ''));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
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
    setSuccessMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePicture: 'Please select an image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePicture: 'Image size must be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, profilePicture: file }));
      
      // Create preview
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
    setPreviewImage(avatarUrl);
    setUseCustomImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('authToken');
      
      // Prepare form data for file upload
      const submitData = new FormData();
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      
      if (formData.newPassword) {
        submitData.append('currentPassword', formData.currentPassword);
        submitData.append('newPassword', formData.newPassword);
      }
      
      if (useCustomImage && formData.profilePicture) {
        submitData.append('profilePicture', formData.profilePicture);
      } else {
        submitData.append('avatar', formData.avatar);
      }
      
      const response = await axios.put(`${apiUrl}/api/auth/profile`, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.user) {
        // Update localStorage with new user data
        const updatedUserData = {
          ...JSON.parse(localStorage.getItem('userData') || '{}'),
          ...response.data.user
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        setSuccessMessage('Profile updated successfully!');
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image load error with fallback
  const handleImageError = (e) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    e.target.src = getFallbackAvatar(userData.username || 'User');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-blue-900 dark:from-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-white hover:text-cyan-200 transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mt-4">Edit Profile</h1>
          <p className="text-cyan-200">Update your account information</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8"
        >
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm mb-6"
            >
              {serverError}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md text-sm mb-6"
            >
              {successMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
                <FaCamera className="mr-2" />
                Profile Picture
              </h3>
              
              {/* Preview */}
              <div className="mb-4">
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full mx-auto border-4 border-cyan-500 object-cover"
                  onError={handleImageError}
                />
              </div>

              {/* Upload Custom Image */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Upload Custom Image</label>
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                    <FaUpload />
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {errors.profilePicture && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.profilePicture}</p>
                )}
              </div>

              {/* Avatar Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Or Choose an Avatar</label>
                <div className="grid grid-cols-4 gap-3">
                  {avatarOptions.map((avatarUrl, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAvatarSelect(avatarUrl)}
                      className={`w-16 h-16 rounded-full border-2 transition-all ${
                        formData.avatar === avatarUrl && !useCustomImage
                          ? 'border-cyan-500 ring-2 ring-cyan-200'
                          : 'border-gray-300 hover:border-cyan-400'
                      }`}
                    >
                      <img
                        src={avatarUrl}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FaUser className="mr-2" />
                Basic Information
              </h3>

              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                    errors.username 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                    errors.email 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Change Password (Optional)</h3>
              
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                    errors.currentPassword 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                    errors.newPassword 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                    errors.confirmPassword 
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FaSave />
                  <span>Save Changes</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileEdit;