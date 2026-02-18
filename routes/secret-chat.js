import express from 'express';
import SecretChat from '../models/SecretChat.js';
import whatsappService from '../services/whatsappService.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// ROT13 encryption/decryption
const rot13 = (str) => str.replace(/[a-zA-Z]/g, c => 
  String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
);

// Get chat history
router.get('/history/:phoneNumber', sessionMiddleware, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await SecretChat.find({ phoneNumber })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send encrypted message
router.post('/send', sessionMiddleware, async (req, res) => {
  try {
    const { phoneNumber, encryptedMessage } = req.body;
    const decrypted = rot13(encryptedMessage);
    
    // Save to DB
    await SecretChat.create({
      phoneNumber,
      message: decrypted,
      encrypted: encryptedMessage,
      sender: 'me'
    });
    
    // Send via WhatsApp
    const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    await whatsappService.sendMessage(jid, decrypted);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-save incoming messages (called by WhatsApp bot)
router.post('/auto-save', async (req, res) => {
  try {
    const { phoneNumber, friendName, message, encrypted, sender } = req.body;
    
    await SecretChat.create({
      phoneNumber,
      friendName,
      message,
      encrypted,
      sender
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch last 10 messages from WhatsApp and save to DB
router.post('/fetch-whatsapp/:phoneNumber', sessionMiddleware, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    const sock = whatsappService.sock;
    if (!sock) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }
    
    // Get chat messages
    const chat = await sock.chatRead(jid, 10);
    let savedCount = 0;
    
    if (chat && chat.messages) {
      for (const msg of chat.messages) {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        if (!text) continue;
        
        const isFromMe = msg.key.fromMe;
        const encrypted = rot13(text);
        
        // Check if already exists
        const exists = await SecretChat.findOne({
          phoneNumber: jid,
          message: text,
          timestamp: new Date(msg.messageTimestamp * 1000)
        });
        
        if (!exists) {
          await SecretChat.create({
            phoneNumber: jid,
            friendName: msg.pushName,
            message: text,
            encrypted,
            sender: isFromMe ? 'me' : 'friend',
            timestamp: new Date(msg.messageTimestamp * 1000)
          });
          savedCount++;
        }
      }
    }
    
    res.json({ success: true, savedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
