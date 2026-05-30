import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { secureStorage } from '../utils/secureStorage.js';
import { getAvatarUrl, getFallbackAvatar } from '../utils/avatarUtils';
import LoadingAnimation from '../components/LoadingAnimation';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = secureStorage.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch fresh user data from API
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
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
      <PageShell className="flex items-center justify-center">
        <LoadingAnimation message="Loading profile..." size="large" />
      </PageShell>
    );
  }

  return (
    <PageShell className="text-slate-100">
      {/* Header */}
      <div className="aura-glass p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <FaArrowLeft />
              <span>Back to Dashboard</span>
            </Button>
          </div>
          <h1 className="aura-headline text-3xl">My Profile</h1>
          <p className="aura-subhead mt-2">View and manage your account information</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aura-glass aura-glass-card p-8"
        >
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-500 shadow-xl">
                <img
                  src={user?.avatar ? getAvatarUrl(user.avatar) : getFallbackAvatar(user?.username || 'User')}
                  alt={user?.username || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getFallbackAvatar(user?.username || 'User'); }}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="aura-headline text-3xl mb-2">
                {user?.username || 'Unknown User'}
              </h2>
              <p className="aura-subhead text-lg mb-4">
                {user?.email || 'No email provided'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {user?.isAdmin && (
                  <span className="aura-chip aura-chip-purple text-sm font-semibold">
                    Admin
                  </span>
                )}
                {user?.isSuperAdmin && (
                  <span className="aura-chip aura-chip-red text-sm font-semibold">
                    Super Admin
                  </span>
                )}
                <span className="aura-chip aura-chip-green text-sm font-semibold">
                  Active Member
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <div>
              <Button
                onClick={() => navigate('/profile/edit')}
              >
                <FaEdit className="mr-2" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="aura-display text-xl border-b border-cyan-500/10 pb-2">
                Personal Information
              </h3>

              {/* Username */}
              <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FaUser className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400">Username</label>
                  <p className="text-lg font-semibold text-slate-200">
                    {user?.username || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <FaEnvelope className="text-green-400" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400">Email Address</label>
                  <p className="text-lg font-semibold text-slate-200">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* WhatsApp Number */}
              <div className="flex items-start gap-4 p-4 bg-black/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <FaPhone className="text-green-400" />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-400">WhatsApp Number</label>
                  <p className="text-lg font-semibold text-slate-200">
                    {formatPhoneNumber(user?.phoneNumber)}
                  </p>
                  {user?.phoneNumber && (
                    <a
                      href={`https://wa.me/${user.phoneNumber.replace('+', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-400 hover:underline"
                    >
                      Open in WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-6">
              <h3 className="aura-display text-xl border-b border-cyan-500/10 pb-2">
                Account Information
              </h3>

              {/* Account Type */}
              <div className="p-4 bg-black/20 rounded-lg">
                <label className="text-sm font-medium text-slate-400 block mb-2">Account Type</label>
                <div className="space-y-2">
                  {user?.isSuperAdmin && (
                    <span className="aura-chip aura-chip-red text-sm font-semibold">
                      Super Administrator
                    </span>
                  )}
                  {user?.isAdmin && !user?.isSuperAdmin && (
                    <span className="aura-chip aura-chip-purple text-sm font-semibold">
                      Administrator
                    </span>
                  )}
                  {!user?.isAdmin && (
                    <span className="aura-chip aura-chip-cyan text-sm font-semibold">
                      Student
                    </span>
                  )}
                </div>
              </div>

              {/* Member Since */}
              <div className="p-4 bg-black/20 rounded-lg">
                <label className="text-sm font-medium text-slate-400 block mb-2">Member Since</label>
                <p className="text-lg font-semibold text-slate-200">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>

              {/* WhatsApp Notifications */}
              <div className="p-4 bg-black/20 rounded-lg">
                <label className="text-sm font-medium text-slate-400 block mb-2">WhatsApp Notifications</label>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${user?.whatsappNotifications ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                  <span className="text-lg font-semibold text-slate-200">
                    {user?.whatsappNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* User ID */}
              <div className="p-4 bg-black/20 rounded-lg">
                <label className="text-sm font-medium text-slate-400 block mb-2">User ID</label>
                <p className="text-sm font-mono text-slate-400 bg-slate-800 p-2 rounded border border-cyan-500/10">
                  {user?._id || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-cyan-500/10">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/profile/edit')}
              >
                <FaEdit className="mr-2" />
                <span>Edit Profile</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                <FaArrowLeft className="mr-2" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default UserProfile;