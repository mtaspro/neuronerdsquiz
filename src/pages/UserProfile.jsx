import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../utils/secureStorage.js';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import LoadingAnimation from '../components/LoadingAnimation';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await secureStorage.getUserData();
        if (userData) {
          setUser(userData);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Not provided';
    if (phone.startsWith('880')) {
      return `+${phone}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
        <LoadingAnimation message="Loading profile..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-purple-950 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 via-blue-900 to-purple-900 dark:from-gray-800 dark:via-gray-900 dark:to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-cyan-200 hover:text-white transition-colors"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-cyan-200 mt-2">View and manage your account information</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-cyan-500 to-purple-500 shadow-xl">
                <img
                  src={user?.avatar ? getAvatarUrl(user.avatar) : getFallbackAvatar(user?.username || 'User')}
                  alt={user?.username || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getFallbackAvatar(user?.username || 'User'); }}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {user?.username || 'Unknown User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                {user?.email || 'No email provided'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {user?.isAdmin && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-semibold">
                    Admin
                  </span>
                )}
                {user?.isSuperAdmin && (
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-semibold">
                    Super Admin
                  </span>
                )}
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold">
                  Active Member
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div>
              <button
                onClick={() => navigate('/profile/edit')}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Personal Information
              </h3>

              {/* Username */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FaUser className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Username</label>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {user?.username || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FaEnvelope className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Address</label>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FaPhone className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">WhatsApp Number</label>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {formatPhoneNumber(user?.phoneNumber)}
                  </p>
                  {user?.phoneNumber && (
                    <a
                      href={`https://wa.me/${user.phoneNumber.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 dark:text-green-400 hover:underline"
                    >
                      Open in WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Account Information
              </h3>

              {/* Account Type */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Account Type</label>
                <div className="space-y-2">
                  {user?.isSuperAdmin && (
                    <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-semibold">
                      Super Administrator
                    </span>
                  )}
                  {user?.isAdmin && !user?.isSuperAdmin && (
                    <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-semibold">
                      Administrator
                    </span>
                  )}
                  {!user?.isAdmin && (
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                      Student
                    </span>
                  )}
                </div>
              </div>

              {/* Member Since */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Member Since</label>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>

              {/* WhatsApp Notifications */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">WhatsApp Notifications</label>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${user?.whatsappNotifications ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    {user?.whatsappNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* User ID */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">User ID</label>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded border">
                  {user?._id || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/profile/edit')}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                <FaArrowLeft />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfile;