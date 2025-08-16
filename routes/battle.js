import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import whatsappService from '../services/whatsappService.js';
import User from '../models/User.js';

const router = express.Router();

// Store active battle room (in production, use Redis or database)
let activeBattleRoom = null;

// Create battle room (admin only)
router.post('/create', sessionMiddleware, async (req, res) => {
  try {
    const { roomId, chapter } = req.body;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can create battle rooms' });
    }
    
    // Set active battle room
    activeBattleRoom = { id: roomId, chapter, status: 'waiting' };
    
    // Broadcast to all connected clients via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('battleRoomCreated', activeBattleRoom);
    }
    
    // Send WhatsApp notifications
    const users = await User.find({ whatsappNotifications: true });
    const phoneNumbers = users.map(user => user.phoneNumber).filter(phone => phone);
    if (phoneNumbers.length > 0) {
      const message = `🔥 Battle Room Created! 🔥\n\nRoom ID: ${roomId}\nChapter: ${chapter}\n\nJoin now and test your skills!`;
      whatsappService.broadcastMessage(phoneNumbers, message);
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

// Start battle (mark as started)
router.post('/start', sessionMiddleware, (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (activeBattleRoom && activeBattleRoom.id === roomId) {
      activeBattleRoom.status = 'started';
      
      // Broadcast to all connected clients
      if (req.app.get('io')) {
        req.app.get('io').emit('battleStarted', activeBattleRoom);
      }
      
      // Send WhatsApp notifications
      const users = await User.find({ whatsappNotifications: true });
      const phoneNumbers = users.map(user => user.phoneNumber).filter(phone => phone);
      if (phoneNumbers.length > 0) {
        const message = `⚡ Battle Started! ⚡\n\nRoom: ${roomId}\nChapter: ${activeBattleRoom.chapter}\n\nThe battle has begun!`;
        whatsappService.broadcastMessage(phoneNumbers, message);
      }
      
      res.json({ success: true, battleRoom: activeBattleRoom });
    } else {
      res.status(404).json({ error: 'Battle room not found' });
    }
  } catch (error) {
    console.error('Error starting battle:', error);
    res.status(500).json({ error: 'Failed to start battle' });
  }
});

// Close battle room
router.post('/close', sessionMiddleware, (req, res) => {
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