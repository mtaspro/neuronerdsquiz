import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Store active battle room (in production, use Redis or database)
let activeBattleRoom = null;

// Create battle room (admin only)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { roomId, chapter } = req.body;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can create battle rooms' });
    }
    
    // Set active battle room
    activeBattleRoom = { id: roomId, chapter };
    
    // Broadcast to all connected clients via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('battleRoomCreated', activeBattleRoom);
    }
    
    res.json({ success: true, battleRoom: activeBattleRoom });
  } catch (error) {
    console.error('Error creating battle room:', error);
    res.status(500).json({ error: 'Failed to create battle room' });
  }
});

// Get active battle room
router.get('/active', (req, res) => {
  res.json({ battleRoom: activeBattleRoom });
});

// Close battle room
router.post('/close', authMiddleware, (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can close battle rooms' });
    }
    
    activeBattleRoom = null;
    
    // Broadcast to all connected clients
    if (req.app.get('io')) {
      req.app.get('io').emit('battleRoomClosed');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error closing battle room:', error);
    res.status(500).json({ error: 'Failed to close battle room' });
  }
});

export default router;