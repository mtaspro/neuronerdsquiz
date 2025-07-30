import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  console.log('Auth middleware - Headers:', req.headers.authorization ? 'Token present' : 'No token');
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth middleware - No valid authorization header');
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded successfully:', { userId: decoded.userId, email: decoded.email, isAdmin: decoded.isAdmin });
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware - Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  console.log('RequireAdmin middleware - User:', req.user);
  
  if (!req.user || !req.user.isAdmin) {
    console.log('RequireAdmin middleware - Access denied. User:', req.user, 'IsAdmin:', req.user?.isAdmin);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('RequireAdmin middleware - Access granted for admin user');
  next();
};

export default authMiddleware;
