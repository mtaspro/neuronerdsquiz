import express from 'express';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Enable maintenance mode (SuperAdmin only)
router.post('/enable', sessionMiddleware, (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    
    // Broadcast maintenance warning to all users
    if (req.app.get('io')) {
      req.app.get('io').emit('maintenanceEnabled');
      
      // After 60 seconds, activate maintenance mode
      setTimeout(() => {
        req.app.get('io').emit('maintenanceActivated');
      }, 60000);
    }
    
    res.json({ success: true, message: 'Maintenance mode enabled with 60s warning' });
  } catch (error) {
    console.error('Error enabling maintenance:', error);
    res.status(500).json({ error: 'Failed to enable maintenance mode' });
  }
});

// Disable maintenance mode (SuperAdmin only)
router.post('/disable', sessionMiddleware, (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    
    // Broadcast maintenance disabled to all users
    if (req.app.get('io')) {
      req.app.get('io').emit('maintenanceDisabled');
    }
    
    res.json({ success: true, message: 'Maintenance mode disabled' });
  } catch (error) {
    console.error('Error disabling maintenance:', error);
    res.status(500).json({ error: 'Failed to disable maintenance mode' });
  }
});

export default router;