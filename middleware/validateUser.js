import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Assuming a logger; fallback to console
const logger = {
  error: console.error,
};

const ERROR_MESSAGES = {
  NO_TOKEN: 'Access denied. No token provided.',
  INVALID_TOKEN: 'Access denied. Invalid token.',
  EXPIRED_TOKEN: 'Access denied. Token expired.',
  USER_NOT_FOUND: 'Access denied. User account no longer exists.',
  SERVER_ERROR: 'Server error during authentication.',
  DB_ERROR: 'Database error during user validation.',
};

// Middleware to validate if user still exists in database
const validateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: ERROR_MESSAGES.NO_TOKEN });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId) {
      return res.status(401).json({ 
        error: ERROR_MESSAGES.INVALID_TOKEN,
        invalidToken: true 
      });
    }

    // Check if user still exists in database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: ERROR_MESSAGES.USER_NOT_FOUND,
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
        error: ERROR_MESSAGES.INVALID_TOKEN,
        invalidToken: true 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: ERROR_MESSAGES.EXPIRED_TOKEN,
        tokenExpired: true 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(401).json({ 
        error: ERROR_MESSAGES.INVALID_TOKEN,
        invalidToken: true 
      });
    }
    
    if (error.name.startsWith('Mongo')) {
      logger.error('Database error during token validation:', error);
      return res.status(500).json({ error: ERROR_MESSAGES.DB_ERROR });
    }
    
    logger.error('Token validation error:', error);
    res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
  }
};

export default validateUser;
