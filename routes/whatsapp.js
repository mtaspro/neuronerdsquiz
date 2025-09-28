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

// Test page for group messages (no auth needed - for your personal use)
router.get('/test-messages', async (req, res) => {
  try {
    const groupName = req.query.group || '';
    const limit = parseInt(req.query.limit) || 50;
    const WhatsAppMessage = (await import('../models/WhatsAppMessage.js')).default;
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp Messages from MongoDB</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .message { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fafafa; }
        .message.bot { background: #e3f2fd; border-left: 4px solid #2196f3; }
        .sender { font-weight: bold; color: #0066cc; margin-bottom: 5px; }
        .timestamp { color: #666; font-size: 12px; margin-top: 8px; }
        .chat-list { background: #f0f8ff; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .stats { background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .phone { color: #888; font-size: 11px; }
        .message-type { background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 WhatsApp Messages from MongoDB</h1>`;
    
    // Get all chats from MongoDB
    const chats = await WhatsAppMessage.aggregate([
      {
        $group: {
          _id: '$chatId',
          chatName: { $first: '$chatName' },
          chatType: { $first: '$chatType' },
          lastMessage: { $first: '$messageText' },
          lastTimestamp: { $max: '$timestamp' },
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { lastTimestamp: -1 } },
      { $limit: 20 }
    ]);
    
    html += `
      <div class="chat-list">
        <h3>📋 Available Chats (${chats.length} total):</h3>
        <ul>`;
    
    chats.forEach(chat => {
      const chatType = chat.chatType === 'group' ? '👥' : '👤';
      html += `<li>${chatType} <a href="?group=${encodeURIComponent(chat.chatName || chat._id)}&limit=${limit}">${chat.chatName || 'Unknown Chat'}</a> (${chat.messageCount} messages)</li>`;
    });
    
    html += `</ul></div>`;
    
    // If specific group requested, show messages from MongoDB
    if (req.query.group) {
      const selectedChat = chats.find(c => 
        (c.chatName && c.chatName.toLowerCase().includes(groupName.toLowerCase())) ||
        c._id.includes(groupName)
      );
      
      if (selectedChat) {
        const messages = await WhatsAppMessage.find({ chatId: selectedChat._id })
          .sort({ timestamp: -1 })
          .limit(limit);
        
        html += `
        <div class="stats">
          <h2>💬 Last ${messages.length} messages from "${selectedChat.chatName || 'Unknown Chat'}"</h2>
          <p><strong>Chat ID:</strong> ${selectedChat._id}</p>
          <p><strong>Type:</strong> ${selectedChat.chatType}</p>
          <p><strong>Total Messages:</strong> ${selectedChat.messageCount}</p>
        </div>`;
        
        if (messages.length === 0) {
          html += `
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <h3>📭 No Messages Found</h3>
            <p>This chat exists but has no messages in the database yet.</p>
          </div>`;
        } else {
          messages.reverse().forEach(msg => {
            const botClass = msg.isFromBot ? ' bot' : '';
            const messageType = msg.messageType !== 'text' ? `<span class="message-type">${msg.messageType.toUpperCase()}</span> ` : '';
            const messageText = msg.messageText || msg.caption || `[${msg.messageType} message]`;
            
            html += `
            <div class="message${botClass}">
              <div class="sender">
                ${msg.senderName || 'Unknown'} 
                ${msg.isFromBot ? '🤖' : ''}
                <span class="phone">(${msg.senderPhone || 'No phone'})</span>
              </div>
              <div>${messageType}${messageText}</div>
              <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
            </div>`;
          });
        }
      } else {
        html += `<h2>❌ Chat "${groupName}" not found in database</h2>`;
      }
    } else {
      // Show overall stats
      const totalMessages = await WhatsAppMessage.countDocuments();
      const groupMessages = await WhatsAppMessage.countDocuments({ chatType: 'group' });
      const personalMessages = await WhatsAppMessage.countDocuments({ chatType: 'personal' });
      const botMessages = await WhatsAppMessage.countDocuments({ isFromBot: true });
      
      html += `
      <div class="stats">
        <h3>📊 Database Statistics:</h3>
        <p><strong>Total Messages:</strong> ${totalMessages}</p>
        <p><strong>Group Messages:</strong> ${groupMessages}</p>
        <p><strong>Personal Messages:</strong> ${personalMessages}</p>
        <p><strong>Bot Messages:</strong> ${botMessages}</p>
        <p><strong>User Messages:</strong> ${totalMessages - botMessages}</p>
      </div>
      <p>👆 Click on any chat above to view its messages!</p>`;
    }
    
    html += `
      </div>
    </body>
    </html>`;
    
    res.send(html);
    
  } catch (error) {
    res.send(`<h1>❌ Error: ${error.message}</h1><pre>${error.stack}</pre>`);
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