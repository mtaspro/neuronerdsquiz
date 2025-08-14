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

    req.user = {
      userId: session.userId._id,
      email: session.userId.email,
      isAdmin: session.userId.isAdmin,
      isSuperAdmin: session.userId.isSuperAdmin
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Session validation failed' });
  }
};