import crypto from 'crypto';

// Simple CSRF protection middleware
const csrfTokens = new Map();

export const generateCSRFToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const userId = req.user?.userId || req.ip;
  
  csrfTokens.set(userId, token);
  
  // Clean up old tokens (simple cleanup)
  if (csrfTokens.size > 1000) {
    const entries = Array.from(csrfTokens.entries());
    entries.slice(0, 500).forEach(([key]) => csrfTokens.delete(key));
  }
  
  res.setHeader('X-CSRF-Token', token);
  next();
};

export const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const userId = req.user?.userId || req.ip;
  
  // Skip CSRF validation if no token provided (for backward compatibility)
  if (!token) {
    console.log('CSRF token not provided, skipping validation');
    return next();
  }
  
  if (!csrfTokens.has(userId) || csrfTokens.get(userId) !== token) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Remove used token
  csrfTokens.delete(userId);
  next();
};