import UserSession from '../models/UserSession.js';
import User from '../models/User.js';

export const sessionMiddleware = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    const session = await UserSession.findOne({ 
      sessionToken,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Extend session expiry on each request (refresh for another 30 days)
    session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await session.save();

    req.user = {
      userId: session.userId._id,
      email: session.userId.email,
      isAdmin: session.userId.isAdmin,
      isSuperAdmin: session.userId.isSuperAdmin,
      userData: session.userData || session.userId // Fallback to populated user data
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Session validation failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  next();
};