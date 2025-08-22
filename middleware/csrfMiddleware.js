import crypto from 'crypto';

// Simple CSRF protection middleware with improved security
const csrfTokens = new Map();
const tokenTimestamps = new Map();
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

export const generateCSRFToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const userId = req.user?.userId || req.ip;
  
  if (!userId) {
    return res.status(400).json({ error: 'Unable to generate CSRF token' });
  }
  
  const now = Date.now();
  csrfTokens.set(userId, token);
  tokenTimestamps.set(userId, now);
  
  // Clean up expired tokens
  if (csrfTokens.size > 1000) {
    for (const [key, timestamp] of tokenTimestamps.entries()) {
      if (now - timestamp > TOKEN_EXPIRY) {
        csrfTokens.delete(key);
        tokenTimestamps.delete(key);
      }
    }
  }
  
  res.setHeader('X-CSRF-Token', token);
  next();
};

export const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const userId = req.user?.userId || req.ip;
  
  if (!userId) {
    return res.status(400).json({ error: 'Unable to validate CSRF token' });
  }
  
  if (!token || typeof token !== 'string') {
    console.log('CSRF token missing or invalid format');
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const storedToken = csrfTokens.get(userId);
  const tokenTime = tokenTimestamps.get(userId);
  
  if (!storedToken || !tokenTime) {
    console.log('CSRF token not found for user:', userId);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Check if token is expired
  if (Date.now() - tokenTime > TOKEN_EXPIRY) {
    csrfTokens.delete(userId);
    tokenTimestamps.delete(userId);
    console.log('CSRF token expired for user:', userId);
    return res.status(403).json({ error: 'CSRF token expired' });
  }
  
  if (storedToken !== token) {
    console.log('CSRF token mismatch for user:', userId);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  // Remove used token (one-time use)
  csrfTokens.delete(userId);
  tokenTimestamps.delete(userId);
  next();
};
