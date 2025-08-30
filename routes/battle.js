import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import whatsappService from '../services/whatsappService.js';
import User from '../models/User.js';

const router = express.Router();

// Store active battle room (in production, use Redis or database)
let activeBattleRoom = null;
let battleRoomCreator = null; // Track who created the room

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
    battleRoomCreator = req.user.id; // Track the creator
    
    // Broadcast to all connected clients via socket
    if (req.app.get('io')) {
      req.app.get('io').emit('battleRoomCreated', activeBattleRoom);
    }
    
    // Send WhatsApp group notification
    await sendBattleNotification(`🔥 Battle Room Created! 🔥\n\nRoom ID: ${roomId}\nChapter: ${chapter}\n\nVisit dashboard and join now to test your skills!`);
    
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
router.post('/start', sessionMiddleware, async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (activeBattleRoom && activeBattleRoom.id === roomId) {
      activeBattleRoom.status = 'started';
      
      // Broadcast to all connected clients
      if (req.app.get('io')) {
        req.app.get('io').emit('battleStarted', activeBattleRoom);
      }
      
      // Send WhatsApp group notification
      await sendBattleNotification(`⚡ Battle Started! ⚡\n\nRoom: ${roomId}\nChapter: ${activeBattleRoom.chapter}\n\nThe battle has begun!`);
      
      res.json({ success: true, battleRoom: activeBattleRoom });
    } else {
      res.status(404).json({ error: 'Battle room not found' });
    }
  } catch (error) {
    console.error('Error starting battle:', error);
    res.status(500).json({ error: 'Failed to start battle' });
  }
});

// End battle (mark as ended)
router.post('/end', sessionMiddleware, async (req, res) => {
  try {
    const { roomId, reason } = req.body;
    
    if (activeBattleRoom && activeBattleRoom.id === roomId) {
      activeBattleRoom.status = 'ended';
      
      // Broadcast to all connected clients
      if (req.app.get('io')) {
        req.app.get('io').emit('battleEnded', activeBattleRoom);
      }
      
      // Send WhatsApp group notification based on reason
      if (reason === 'stopped') {
        await sendBattleNotification(`🛑 Battle Stopped! 🛑\n\nRoom: ${roomId}\nChapter: ${activeBattleRoom.chapter}\n\nThe battle was stopped by the admin.`);
      } else {
        await sendBattleNotification(`🏁 Battle Ended! 🏁\n\nRoom: ${roomId}\nChapter: ${activeBattleRoom.chapter}\n\nAll participants have finished the battle!`);
      }
      
      // Clear the battle room immediately after ending
      setTimeout(() => {
        activeBattleRoom = null;
        battleRoomCreator = null;
        if (req.app.get('io')) {
          req.app.get('io').emit('battleRoomClosed');
        }
        console.log(`🗑️ Battle room ${roomId} cleared after ending`);
      }, 5000); // Reduced to 5 seconds
      
      res.json({ success: true, battleRoom: activeBattleRoom });
    } else {
      res.status(404).json({ error: 'Battle room not found' });
    }
  } catch (error) {
    console.error('Error ending battle:', error);
    res.status(500).json({ error: 'Failed to end battle' });
  }
});

// Close battle room
router.post('/close', sessionMiddleware, (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Only admins can close battle rooms' });
    }
    
    activeBattleRoom = null;
    battleRoomCreator = null;
    
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

// Expire battle room when creator leaves
router.post('/expire', sessionMiddleware, (req, res) => {
  try {
    const { roomId, userId } = req.body;
    
    // Check if the user leaving is the creator and battle hasn't started
    if (activeBattleRoom && 
        activeBattleRoom.id === roomId && 
        battleRoomCreator === userId && 
        activeBattleRoom.status === 'waiting') {
      
      console.log(`Battle room ${roomId} expired - creator left before starting`);
      activeBattleRoom.status = 'expired';
      
      // Broadcast expiration to all connected clients
      if (req.app.get('io')) {
        req.app.get('io').emit('battleRoomExpired', { roomId, reason: 'Creator left' });
      }
      
      // Clear the battle room after 5 seconds
      setTimeout(() => {
        activeBattleRoom = null;
        battleRoomCreator = null;
        if (req.app.get('io')) {
          req.app.get('io').emit('battleRoomClosed');
        }
      }, 5000);
      
      res.json({ success: true, expired: true });
    } else {
      res.json({ success: true, expired: false });
    }
  } catch (error) {
    console.error('Error expiring battle room:', error);
    res.status(500).json({ error: 'Failed to expire battle room' });
  }
});

// Helper function to send battle notifications to configured group
async function sendBattleNotification(message) {
  try {
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    
    if (setting?.settingValue) {
      await whatsappService.sendGroupMessage(setting.settingValue, message);
    }
  } catch (error) {
    console.error('Error sending battle notification:', error);
  }
}

// Export function to clear active battle room
export function clearActiveBattleRoom(roomId) {
  if (activeBattleRoom && activeBattleRoom.id === roomId) {
    console.log(`🗑️ Clearing active battle room: ${roomId}`);
    activeBattleRoom = null;
    battleRoomCreator = null;
    return true;
  }
  return false;
}

export default router;