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

  // Cool and professional avatar options - 4 for boys, 4 for girls
  const avatarOptions = [
    // Boys Avatars
    'https://avatar.iran.liara.run/public/41',
    'https://avatar.iran.liara.run/public/43',
    'https://avatar.iran.liara.run/public/38',
    'https://avatar.iran.liara.run/public/40',
    // Girls Avatars
    'https://avatar.iran.liara.run/public/100',
    'https://avatar.iran.liara.run/public/56',
    'https://avatar.iran.liara.run/public/73',
    'https://avatar.iran.liara.run/public/97'
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

  // ... rest of the file remains unchanged ...
