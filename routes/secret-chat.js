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
    
    console.log('📥 [HISTORY] Request for phoneNumber:', phoneNumber);
    
    // Normalize phone number - remove @ and everything after it
    phoneNumber = phoneNumber.split('@')[0];
    
    console.log('🔍 [HISTORY] Normalized phoneNumber:', phoneNumber);
    console.log('🔍 [HISTORY] Searching DB with regex: ^' + phoneNumber);
    
    const limit = parseInt(req.query.limit) || 20; // Default to 20
    
    const messages = await SecretChat.find({ 
      phoneNumber: { $regex: `^${phoneNumber}` } 
    })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    console.log(`✅ [HISTORY] Found ${messages.length} messages (showing last ${limit})`);
    
    if (messages.length > 0) {
      console.log('📊 [HISTORY] Sample messages:');
      messages.slice(0, 3).forEach((msg, index) => {
        console.log(`  ${index + 1}. ID: ${msg._id}`);
        console.log(`     phoneNumber: ${msg.phoneNumber}`);
        console.log(`     sender: ${msg.sender}`);
        console.log(`     message: ${msg.message.substring(0, 30)}...`);
        console.log(`     timestamp: ${msg.timestamp}`);
      });
    } else {
      console.log('⚠️ [HISTORY] No messages found! Checking what exists in DB...');
      
      // Debug: Show all messages in DB
      const allMessages = await SecretChat.find({}).limit(5).sort({ timestamp: -1 });
      console.log('📊 [HISTORY] Recent messages in DB:');
      allMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. phoneNumber: ${msg.phoneNumber}, sender: ${msg.sender}`);
      });
    }
    
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('❌ [HISTORY] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send encrypted message
router.post('/send', sessionMiddleware, async (req, res) => {
  try {
    let { phoneNumber, realNumber, encryptedMessage } = req.body;
    
    // Normalize phone number for saving
    phoneNumber = phoneNumber.split('@')[0];
    
    // Normalize real number
    if (!realNumber.startsWith('88')) {
      realNumber = '88' + realNumber;
    }
    
    const decrypted = rot13(encryptedMessage);
    
    // Save to DB with LID format
    await SecretChat.create({
      phoneNumber, // LID format
      realNumber, // Store real number for mapping
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
    
    console.log('💾 [AUTO-SAVE] Incoming request:', {
      phoneNumber,
      friendName,
      messagePreview: message.substring(0, 20) + '...',
      encryptedPreview: encrypted.substring(0, 20) + '...',
      sender
    });
    
    const saved = await SecretChat.create({
      phoneNumber,
      friendName,
      message,
      encrypted,
      sender
    });
    
    console.log('✅ [AUTO-SAVE] Successfully saved to DB with ID:', saved._id);
    console.log('📊 [AUTO-SAVE] Saved document:', {
      _id: saved._id,
      phoneNumber: saved.phoneNumber,
      friendName: saved.friendName,
      sender: saved.sender,
      timestamp: saved.timestamp
    });
    
    res.json({ success: true, savedId: saved._id });
  } catch (error) {
    console.error('❌ [AUTO-SAVE] Error:', error);
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

// Find LID for a sender number (used by WhatsApp bot)
router.get('/find-lid/:senderNumber', async (req, res) => {
  try {
    const { senderNumber } = req.params;
    
    console.log('🔍 [FIND-LID] Searching for LID with sender number:', senderNumber);
    
    // Look for any message where this sender number was used as realNumber
    const existingMessage = await SecretChat.findOne({
      realNumber: senderNumber,
      sender: 'me'
    }).sort({ timestamp: -1 });
    
    console.log('🔍 [FIND-LID] Database query result:', existingMessage ? 'FOUND' : 'NOT FOUND');
    
    if (existingMessage) {
      console.log('✅ [FIND-LID] Found LID mapping:', existingMessage.phoneNumber, 'for real number:', senderNumber);
      console.log('📊 [FIND-LID] Full message details:', {
        _id: existingMessage._id,
        phoneNumber: existingMessage.phoneNumber,
        realNumber: existingMessage.realNumber,
        sender: existingMessage.sender,
        timestamp: existingMessage.timestamp
      });
      return res.json({ success: true, lid: existingMessage.phoneNumber });
    }
    
    // If no mapping found, return null
    console.log('❌ [FIND-LID] No LID mapping found for sender:', senderNumber);
    console.log('🔍 [FIND-LID] Checking all existing messages with realNumber field...');
    
    // Debug: Show all messages with realNumber field
    const allWithRealNumber = await SecretChat.find({ realNumber: { $exists: true } }).limit(5);
    console.log('📊 [FIND-LID] Sample messages with realNumber:', allWithRealNumber.map(m => ({
      phoneNumber: m.phoneNumber,
      realNumber: m.realNumber,
      sender: m.sender
    })));
    
    res.json({ success: false, lid: null });
  } catch (error) {
    console.error('❌ [FIND-LID] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
