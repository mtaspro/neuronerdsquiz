import express from 'express';
import whatsappService from '../services/whatsappService.js';
import User from '../models/User.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Get all groups with their IDs
router.get('/groups', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await whatsappService.getGroups();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get QR code for web scanning (public endpoint)
router.get('/qr', async (req, res) => {
  try {

    const status = whatsappService.getConnectionStatus();
    const qr = whatsappService.getQRCode();
    
    if (qr) {
      // Generate QR code as data URL for web display
      const QRCode = await import('qrcode');
      const qrDataURL = await QRCode.toDataURL(qr, { width: 300 });
      
      // Return HTML page with QR code image
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .qr-container { margin: 20px auto; }
            .status { color: #666; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>📱 Scan with WhatsApp</h1>
          <div class="qr-container">
            <img src="${qrDataURL}" alt="WhatsApp QR Code" />
          </div>
          <div class="status">
            <p>✅ QR Code Ready - Scan with your WhatsApp app</p>
            <p><small>Refresh page if QR code expires</small></p>
          </div>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Status</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          </style>
        </head>
        <body>
          <h1>WhatsApp Status</h1>
          <p>${status.isConnected ? '✅ WhatsApp Connected' : '❌ WhatsApp Not Connected'}</p>
          <p>${status.isInitializing ? '🔄 Initializing...' : ''}</p>
          <p><small>Refresh page to check for QR code</small></p>
        </body>
        </html>
      `);
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

// Set battle notification group
router.post('/set-battle-group', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { groupId } = req.body;
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    
    await WhatsAppSettings.findOneAndUpdate(
      { settingKey: 'battleNotificationGroup' },
      { 
        settingValue: groupId,
        updatedBy: req.user.userId
      },
      { upsert: true }
    );
    
    res.json({ success: true, message: 'Battle notification group set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get battle notification group
router.get('/battle-group', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    
    res.json({ groupId: setting?.settingValue || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set daily calendar group
router.post('/set-calendar-group', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { groupId } = req.body;
    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    
    await WhatsAppSettings.findOneAndUpdate(
      { settingKey: 'dailyCalendarGroup' },
      { 
        settingValue: groupId,
        updatedBy: req.user.userId
      },
      { upsert: true }
    );
    
    res.json({ success: true, message: 'Daily calendar group set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily calendar group
router.get('/calendar-group', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const WhatsAppSettings = (await import('../models/WhatsAppSettings.js')).default;
    const setting = await WhatsAppSettings.findOne({ settingKey: 'dailyCalendarGroup' });
    
    res.json({ groupId: setting?.settingValue || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get last 20 messages from a group (for personal use)
router.get('/group-messages/:groupId', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await whatsappService.getGroupMessages(groupId, limit);
    
    if (result.success) {
      res.json({
        success: true,
        groupId: groupId,
        messages: result.messages,
        count: result.count,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple endpoint to get group messages by group name (for quick access)
router.get('/messages/:groupName', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { groupName } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    // Find group by name first
    const groupsResult = await whatsappService.getGroups();
    if (!groupsResult.success) {
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }
    
    const group = groupsResult.groups.find(g => 
      g.name.toLowerCase().includes(groupName.toLowerCase())
    );
    
    if (!group) {
      return res.status(404).json({ 
        error: `Group containing '${groupName}' not found`,
        availableGroups: groupsResult.groups.map(g => g.name)
      });
    }
    
    const result = await whatsappService.getGroupMessages(group.id, limit);
    
    if (result.success) {
      res.json({
        success: true,
        groupName: group.name,
        groupId: group.id,
        messages: result.messages,
        count: result.count,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;