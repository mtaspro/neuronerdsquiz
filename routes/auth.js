import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

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
  const { email, password } = req.body;
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

    const user = new User({ email, password });
    console.log('Creating new user with email:', email);
    console.log('User object before save:', { email: user.email, hasPassword: !!user.password });
    
    await user.save();
    console.log('User saved successfully with ID:', user._id);
    console.log('User object after save:', { _id: user._id, email: user.email, isAdmin: user.isAdmin });

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Return both token and user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin
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
      isAdmin: user.isAdmin
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
