import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import User from '../models/User.js';
import UserScore from '../models/UserScore.js';
import UserSession from '../models/UserSession.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import { generateCSRFToken, validateCSRFToken } from '../middleware/csrfMiddleware.js';

import { uploadToCloudinary } from '../utils/cloudinaryConfig.js';

const router = express.Router();

// Multer memory storage for Cloudinary upload
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Test route to verify auth router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working!' });
});

// Test registration route (for debugging only)
router.post('/test-register', async (req, res) => {
  console.log('Test registration route accessed');
  console.log('Request body:', req.body);
  
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    console.log('Creating test user...');
    const user = new User({ email, password });
    await user.save();
    console.log('Test user saved with ID:', user._id);
    res.json({ success: true, userId: user._id });
  } catch (err) {
    console.error('Test registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Registration route
router.post('/register', memoryUpload.single('profilePicture'), async (req, res) => {
  const { email, password, username, avatar } = req.body;
  console.log('Registration attempt for email:', email);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
  
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required.' });

  try {
    const existingUser = await User.findOne({ email });
    console.log('Existing user check:', existingUser ? 'Found existing user' : 'No existing user');
    
    if (existingUser)
      return res.status(409).json({ error: 'Email already registered.' });

    let userAvatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`;
    
    // Handle profile picture upload during registration
    if (req.file) {
      try {
        userAvatar = await uploadToCloudinary(req.file.buffer, 'profile-pictures');
      } catch (error) {
        console.error('Cloudinary upload error during registration:', error);
        // Continue with default avatar if upload fails
      }
    }
    
    const user = new User({ 
      email, 
      password,
      username: username || email.split('@')[0], // Use email prefix if no username
      avatar: userAvatar
    });
    console.log('Creating new user with email:', email);
    console.log('User object before save:', { email: user.email, hasPassword: !!user.password, username: user.username });
    
    await user.save();
    console.log('User saved successfully with ID:', user._id);
    console.log('User object after save:', { _id: user._id, email: user.email, isAdmin: user.isAdmin, username: user.username });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    // Create session in MongoDB
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = new UserSession({
      userId: user._id,
      sessionToken
    });
    await session.save();
    
    // Return session token and user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      username: user.username,
      avatar: user.avatar
    };
    
    console.log('Registration successful for user:', email);
    res.status(201).json({ token: sessionToken, user: userData });
  } catch (err) {
    console.error('Registration error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);
  
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required.' });

  try {
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Create session in MongoDB
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = new UserSession({
      userId: user._id,
      sessionToken
    });
    await session.save();
    
    // Return session token and user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      username: user.username,
      avatar: user.avatar
    };
    
    console.log('Login successful for user:', email);
    res.json({ token: sessionToken, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Validate session and user existence - CRITICAL SECURITY ENDPOINT
router.get('/validate', sessionMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      console.log(`🚨 SECURITY: User ${req.user.userId} token valid but user deleted from database`);
      return res.status(401).json({ 
        valid: false,
        error: 'User account no longer exists.',
        userDeleted: true 
      });
    }
    
    // Avatar validation - Cloudinary URLs are always accessible
    let avatar = user.avatar;
    
    res.json({ 
      valid: true,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: avatar,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      }
    });
  } catch (err) {
    console.error('Error validating user:', err);
    res.status(401).json({ 
      valid: false,
      error: 'Token validation failed.',
      invalidToken: true 
    });
  }
});

// Sample protected route
router.get('/me', sessionMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found.',
        userDeleted: true 
      });
    }
    
    res.json({ 
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// Get CSRF token
router.get('/csrf-token', sessionMiddleware, generateCSRFToken, (req, res) => {
  res.json({ message: 'CSRF token generated' });
});

// Profile update route
router.put('/profile', sessionMiddleware, validateCSRFToken, memoryUpload.single('profilePicture'), async (req, res) => {
  try {
    const { username, email, phoneNumber, whatsappNotifications, currentPassword, newPassword, avatar } = req.body;
    const userId = req.user.userId;
    
    console.log('Profile update request for user:', userId);
    console.log('Request body:', { username, email, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword, avatar });
    console.log('Uploaded file:', req.file ? req.file.filename : 'None');
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found.',
        userDeleted: true 
      });
    }
    
    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required.' });
    }
    
    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email is already taken by another user.' });
      }
    }
    
    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password.' });
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Update basic info
    user.username = username;
    user.email = email;
    
    // Format phone number for Bangladesh
    let formattedPhone = phoneNumber || '';
    if (formattedPhone && formattedPhone.startsWith('01')) {
      formattedPhone = '+880' + formattedPhone.substring(1);
    }
    user.phoneNumber = formattedPhone;
    user.whatsappNotifications = whatsappNotifications === 'true' || whatsappNotifications === true;
    
    // Handle avatar/profile picture
    if (req.file) {
      try {
        console.log('📸 Uploading profile picture to Cloudinary...');
        console.log('File size:', req.file.size, 'bytes');
        console.log('File type:', req.file.mimetype);
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, 'profile-pictures');
        console.log('✅ Cloudinary upload successful:', cloudinaryUrl);
        user.avatar = cloudinaryUrl;
      } catch (error) {
        console.error('❌ Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Failed to upload profile picture.' });
      }
    } else if (avatar) {
      // Using predefined avatar
      console.log('🎭 Using predefined avatar:', avatar);
      user.avatar = avatar;
    }
    
    // Save updated user
    await user.save();
    
    // Update leaderboard entry if it exists
    await UserScore.findOneAndUpdate(
      { userId: user._id },
      { $set: { username: user.username, avatar: user.avatar } }
    );
    
    // Return updated user data (excluding password)
    const updatedUserData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      isAdmin: user.isAdmin
    };
    
    console.log('Profile updated successfully for user:', userId);
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUserData 
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Logout route
router.post('/logout', sessionMiddleware, async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    await UserSession.deleteOne({ sessionToken });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Delete account route - allows users to delete their own account
router.delete('/delete-account', sessionMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find and delete the user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Note: Cloudinary images don't need manual deletion as they persist in the cloud
    
    console.log('User account deleted:', user.email);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// Debug route to list all users (remove this in production)
router.get('/debug/users', async (req, res) => {
  console.log('Debug route accessed');
  try {
    console.log('Attempting to find users...');
    const users = await User.find({}, 'email isAdmin isSuperAdmin createdAt');
    console.log('All users in database:', users);
    res.json({ users });
  } catch (err) {
    console.error('Debug route error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// Temporary route to make yourself SuperAdmin (REMOVE AFTER USE)
router.post('/debug/make-superadmin', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { isSuperAdmin: true, isAdmin: true } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: `${email} is now SuperAdmin`, user: { email: user.email, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;