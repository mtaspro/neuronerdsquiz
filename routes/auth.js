import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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
router.post('/register', async (req, res) => {
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

    const user = new User({ 
      email, 
      password,
      username: username || email.split('@')[0], // Use email prefix if no username
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`
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

    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Return both token and user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      username: user.username,
      avatar: user.avatar
    };
    
    console.log('Registration successful for user:', email);
    res.status(201).json({ token, user: userData });
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

    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Return both token and user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      username: user.username,
      avatar: user.avatar
    };
    
    console.log('Login successful for user:', email);
    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Sample protected route
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('email -_id');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// Profile update route
router.put('/profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword, avatar } = req.body;
    const userId = req.user.userId;
    
    console.log('Profile update request for user:', userId);
    console.log('Request body:', { username, email, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword, avatar });
    console.log('Uploaded file:', req.file ? req.file.filename : 'None');
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
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
    
    // Handle avatar/profile picture
    if (req.file) {
      // Delete old profile picture if it exists and is a file
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldFilePath = path.join(process.cwd(), user.avatar);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Set new profile picture path
      user.avatar = `/uploads/${req.file.filename}`;
    } else if (avatar) {
      // Using predefined avatar
      // Delete old profile picture if it was a custom upload
      if (user.avatar && user.avatar.startsWith('/uploads/')) {
        const oldFilePath = path.join(process.cwd(), user.avatar);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      user.avatar = avatar;
    }
    
    // Save updated user
    await user.save();
    
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
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(uploadsDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Debug route to list all users (remove this in production)
router.get('/debug/users', async (req, res) => {
  console.log('Debug route accessed');
  try {
    console.log('Attempting to find users...');
    const users = await User.find({}, 'email isAdmin createdAt');
    console.log('All users in database:', users);
    res.json({ users });
  } catch (err) {
    console.error('Debug route error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

export default router;
