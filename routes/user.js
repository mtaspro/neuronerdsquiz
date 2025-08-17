import express from 'express';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import User from '../models/User.js';
import UserMessage from '../models/UserMessage.js';
import whatsappService from '../services/whatsappService.js';

const router = express.Router();

// Get all users with WhatsApp numbers (for messaging)
router.get('/whatsapp-users', sessionMiddleware, async (req, res) => {
  try {
    const users = await User.find({ 
      phoneNumber: { $exists: true, $ne: '' } 
    }, 'username phoneNumber').sort('username');
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get WhatsApp groups
router.get('/whatsapp-groups', sessionMiddleware, async (req, res) => {
  try {
    const result = await whatsappService.getGroups();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Send WhatsApp message to individual user
router.post('/send-whatsapp-message', sessionMiddleware, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    
    if (!recipientId || !message) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    // Get sender and recipient info
    const sender = await User.findById(req.user.userId).select('username');
    const recipient = await User.findById(recipientId).select('username phoneNumber');
    
    if (!recipient || !recipient.phoneNumber) {
      return res.status(404).json({ error: 'Recipient not found or no WhatsApp number' });
    }

    // Format message with sender name
    const formattedMessage = `📩 Message from ${sender.username}:\n\n${message}`;
    
    // Send via WhatsApp
    const result = await whatsappService.sendMessage(recipient.phoneNumber, formattedMessage);
    
    if (result.success) {
      res.json({ success: true, message: `Message sent to ${recipient.username}` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send WhatsApp message to group
router.post('/send-whatsapp-group-message', sessionMiddleware, async (req, res) => {
  try {
    const { groupId, message } = req.body;
    
    if (!groupId || !message) {
      return res.status(400).json({ error: 'Group ID and message are required' });
    }

    // Get sender info
    const sender = await User.findById(req.user.userId).select('username');
    
    // Format message with sender name
    const formattedMessage = `📩 Message from ${sender.username}:\n\n${message}`;
    
    // Send to group
    const result = await whatsappService.sendGroupMessage(groupId, formattedMessage);
    
    if (result.success) {
      res.json({ success: true, message: 'Message sent to group' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// Get user's inbox messages
router.get('/inbox', sessionMiddleware, async (req, res) => {
  try {
    const messages = await UserMessage.find({ 
      recipientId: req.user.userId 
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// Mark message as read
router.put('/inbox/:messageId/read', sessionMiddleware, async (req, res) => {
  try {
    const message = await UserMessage.findOneAndUpdate(
      { _id: req.params.messageId, recipientId: req.user.userId },
      { isRead: true },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Get unread message count
router.get('/inbox/unread-count', sessionMiddleware, async (req, res) => {
  try {
    const count = await UserMessage.countDocuments({ 
      recipientId: req.user.userId,
      isRead: false 
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

export default router;