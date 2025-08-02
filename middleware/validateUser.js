import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to validate if user still exists in database
const validateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied. User account no longer exists.',
        userDeleted: true 
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token.',
        invalidToken: true 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied. Token expired.',
        tokenExpired: true 
      });
    }
    
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

export default validateUser;