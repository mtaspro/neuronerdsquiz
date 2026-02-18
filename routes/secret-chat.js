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
    let { phoneNumber } = req.params;
    
    console.log('📥 History request for:', phoneNumber);
    
    // Normalize phone number - remove @ and everything after it
    phoneNumber = phoneNumber.split('@')[0];
    
    console.log('🔍 Searching DB for:', phoneNumber);
    
    const limit = parseInt(req.query.limit) || 20; // Default to 20
    
    const messages = await SecretChat.find({ 
      phoneNumber: { $regex: `^${phoneNumber}` } 
    })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    console.log(`✅ Found ${messages.length} messages (showing last ${limit})`);
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.sender}: ${msg.encrypted.substring(0, 20)}...`);
    });
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send encrypted message
router.post('/send', sessionMiddleware, async (req, res) => {
  try {
    let { phoneNumber, realNumber, encryptedMessage } = req.body;
    
    // Normalize phone number for saving
    phoneNumber = phoneNumber.split('@')[0];
    
    const decrypted = rot13(encryptedMessage);
    
    // Save to DB with LID format
    await SecretChat.create({
      phoneNumber, // LID format
      message: decrypted,
      encrypted: encryptedMessage,
      sender: 'me'
    });
    
    console.log(`📤 Sending to: ${realNumber} (saved as: ${phoneNumber})`);
    
    // Send via WhatsApp using real number
    const jid = realNumber.includes('@') ? realNumber : `${realNumber}@s.whatsapp.net`;
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
    
    console.log('💾 Auto-save request:', { phoneNumber, sender, messagePreview: message.substring(0, 20) });
    
    const saved = await SecretChat.create({
      phoneNumber,
      friendName,
      message,
      encrypted,
      sender
    });
    
    console.log('✅ Saved to DB with ID:', saved._id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Auto-save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch last 10 messages from WhatsApp and save to DB
router.post('/fetch-whatsapp/:phoneNumber', sessionMiddleware, async (req, res) => {
  try {
    let { phoneNumber } = req.params;
    
    // Normalize phone number
    phoneNumber = phoneNumber.split('@')[0];
    
    // Simply return existing messages from DB
    const messages = await SecretChat.find({ 
      phoneNumber: { $regex: `^${phoneNumber}` }
    })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({ 
      success: true, 
      savedCount: messages.length,
      message: 'Showing existing messages from database'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
