import express from 'express';
import whatsappService from '../services/whatsappService.js';
import User from '../models/User.js';
import sessionMiddleware from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Admin send message to user
router.post('/send-message', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { phoneNumber, message } = req.body;
    const success = await whatsappService.sendMessage(phoneNumber, message);
    
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin broadcast message
router.post('/broadcast', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { message, userIds } = req.body;
    
    let users;
    if (userIds && userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds }, whatsappNotifications: true });
    } else {
      users = await User.find({ whatsappNotifications: true });
    }

    const phoneNumbers = users.map(user => user.phoneNumber).filter(phone => phone);
    const results = await whatsappService.broadcastMessage(phoneNumbers, message);
    
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send group message
router.post('/send-group', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { groupId, message } = req.body;
    const success = await whatsappService.sendGroupMessage(groupId, message);
    
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;