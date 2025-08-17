import express from 'express';
import whatsappService from '../services/whatsappService.js';
import User from '../models/User.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Get QR code for web scanning (public endpoint)
router.get('/qr', async (req, res) => {
  try {

    const status = whatsappService.getConnectionStatus();
    const qr = whatsappService.getQRCode();
    
    if (qr) {
      // Generate QR code as data URL for web display
      const QRCode = await import('qrcode');
      const qrDataURL = await QRCode.toDataURL(qr);
      res.json({ qr: qrDataURL, status });
    } else {
      res.json({ qr: null, status });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin send message to user
router.post('/send-message', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { phoneNumber, message } = req.body;
    const result = await whatsappService.sendMessage(phoneNumber, message);
    
    if (result.success) {
      res.json({ success: true, message: 'Message sent successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
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