import UserSession from '../models/UserSession.js';
import User from '../models/User.js';

export const sessionMiddleware = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length < 10) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    let session;
    try {
      session = await UserSession.findOne({ 
        sessionToken,
        expiresAt: { $gt: new Date() }
      }).populate('userId');
    } catch (dbError) {
      console.error('Database error during session lookup:', dbError.message);
      return res.status(500).json({ error: 'Session lookup failed' });
    }

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    if (!session.userId || !session.userId._id) {
      console.error('Session found but user data missing:', session._id);
      await UserSession.findByIdAndDelete(session._id); // Clean up orphaned session
      return res.status(401).json({ error: 'Invalid session data' });
    }

    // Extend session expiry only if it's close to expiring (reduces DB writes)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    if (session.expiresAt < sevenDaysFromNow) {
      session.expiresAt = thirtyDaysFromNow;
      try {
        await session.save();
      } catch (saveError) {
        console.error('Failed to update session expiry:', saveError.message);
        // Don't fail the request, just log the error
      }
    }

    req.user = {
      userId: session.userId._id,
      email: session.userId.email || 'unknown@example.com',
      isAdmin: Boolean(session.userId.isAdmin),
      isSuperAdmin: Boolean(session.userId.isSuperAdmin),
      userData: session.userData || {
        _id: session.userId._id,
        email: session.userId.email,
        isAdmin: session.userId.isAdmin,
        isSuperAdmin: session.userId.isSuperAdmin
      }
    };

    next();
  } catch (error) {
    console.error('Session middleware error:', error.message);
    
    // Don't leak internal error details
    if (error.name === 'CastError') {
      return res.status(401).json({ error: 'Invalid session token format' });
    }
    
    res.status(500).json({ error: 'Session validation failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  console.log('RequireAdmin check for user:', req.user?.userId);
  
  if (!req.user?.isAdmin) {
    console.log('Admin access denied for user:', req.user?.userId);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('Admin access granted for user:', req.user.userId);
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  console.log('RequireSuperAdmin check for user:', req.user?.userId);
  
  if (!req.user?.isSuperAdmin) {
    console.log('SuperAdmin access denied for user:', req.user?.userId);
    return res.status(403).json({ error: 'SuperAdmin access required' });
  }
  
  console.log('SuperAdmin access granted for user:', req.user.userId);
  next();
};
