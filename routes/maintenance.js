import express from 'express';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = express.Router();

let maintenanceState = {
  isActive: false,
  countdownStartTime: null,
  countdownDuration: 60000 // 60 seconds
};

// Enable maintenance mode (SuperAdmin only)
router.post('/enable', sessionMiddleware, (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    
    maintenanceState.countdownStartTime = Date.now();
    maintenanceState.isActive = false;
    
    // Broadcast maintenance warning to all users
    if (req.app.get('io')) {
      req.app.get('io').emit('maintenanceEnabled', {
        countdownStartTime: maintenanceState.countdownStartTime,
        countdownDuration: maintenanceState.countdownDuration
      });
      
      // After 60 seconds, activate maintenance mode
      setTimeout(() => {
        maintenanceState.isActive = true;
        req.app.get('io').emit('maintenanceActivated');
      }, maintenanceState.countdownDuration);
    }
    
    res.json({ success: true, message: 'Maintenance mode enabled with 60s warning' });
  } catch (error) {
    console.error('Error enabling maintenance:', error);
    res.status(500).json({ error: 'Failed to enable maintenance mode' });
  }
});

// Auto-trigger maintenance on deployment (no auth required)
router.post('/auto-trigger', (req, res) => {
  try {
    const { secret } = req.body;
    
    // Verify deployment secret
    if (secret !== process.env.DEPLOYMENT_SECRET) {
      return res.status(403).json({ error: 'Invalid secret' });
    }
    
    maintenanceState.countdownStartTime = Date.now();
    maintenanceState.isActive = false;
    
    // Broadcast maintenance warning to all users
    if (req.app.get('io')) {
      req.app.get('io').emit('maintenanceEnabled', {
        countdownStartTime: maintenanceState.countdownStartTime,
        countdownDuration: maintenanceState.countdownDuration
      });
      
      // After 60 seconds, activate maintenance mode
      setTimeout(() => {
        maintenanceState.isActive = true;
        req.app.get('io').emit('maintenanceActivated');
      }, maintenanceState.countdownDuration);
    }
    
    console.log('🔧 Auto-maintenance triggered by deployment');
    res.json({ success: true, message: 'Auto-maintenance triggered' });
  } catch (error) {
    console.error('Error auto-triggering maintenance:', error);
    res.status(500).json({ error: 'Failed to auto-trigger maintenance' });
  }
});

// Get maintenance status (public endpoint)
router.get('/status', (req, res) => {
  res.json(maintenanceState);
});

// Disable maintenance mode (SuperAdmin only)
router.post('/disable', sessionMiddleware, (req, res) => {
  try {
    if (!req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    
    maintenanceState.isActive = false;
    maintenanceState.countdownStartTime = null;
    
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