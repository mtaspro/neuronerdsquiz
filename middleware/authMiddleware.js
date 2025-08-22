import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // Check if JWT_SECRET is configured
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  console.log('Auth middleware - Headers:', req.headers.authorization ? 'Token present' : 'No token');
  
  const authHeader = req.headers.authorization;
  // Improved validation: check type and format
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    console.log('Auth middleware - No valid authorization header');
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  // Additional token validation
  if (!token || token.length === 0) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Secure logging - only log user ID, not sensitive data
    console.log('Auth middleware - Token decoded successfully for user:', decoded.userId);
    req.user = decoded;
    next();
  } catch (err) {
    // Better error handling with specific error types
    console.error('Auth middleware - Token verification failed:', err.name);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      return res.status(401).json({ error: 'Token verification failed' });
    }
  }
};

export const requireAdmin = (req, res, next) => {
  // More secure and informative logging
  console.log('RequireAdmin middleware - Checking admin access for user:', req.user?.userId);
  
  if (!req.user || !req.user.isAdmin) {
    console.log('RequireAdmin middleware - Access denied for user:', req.user?.userId);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('RequireAdmin middleware - Access granted for admin user:', req.user.userId);
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  // Added consistent logging like other middlewares
  console.log('RequireSuperAdmin middleware - Checking super admin access for user:', req.user?.userId);
  
  if (!req.user || !req.user.isSuperAdmin) {
    console.log('RequireSuperAdmin middleware - Access denied for user:', req.user?.userId);
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  
  console.log('RequireSuperAdmin middleware - Access granted for super admin user:', req.user.userId);
  next();
};

export default authMiddleware;
