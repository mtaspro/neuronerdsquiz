import express from 'express';
import whatsappService from '../services/whatsappService.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import NotepadMessage from '../models/NotepadMessage.js';

const router = express.Router();
const MAX_HISTORY = 10;

// Emoji mappings
const emojiMap = {
  ':sm:': '😊',
  ':thumb:': '👍',
  ':j:': '😂',
  ':uj:': '🤣',
  ':thinking:': '🤔',
  ':sus:': '🤨',
  ':hgg:': '🤗',
  ':nsm:': '😁',
  ':pl:': '🥺',
  ':kss:': '😘',
  ':l:': '🥰',
  ':ks:': '😚',
  ':n:': '😜',
  ':cr:': '😭',
  ':gl:': '😎',
  ':h:': '🥳',
  ':sd:': '😞',
  ':w:': '😮',
  ':f:': '😨'
};

const reverseEmojiMap = Object.fromEntries(
  Object.entries(emojiMap).map(([k, v]) => [v, k])
);

// Convert emojis to shortcodes
function emojisToShortcodes(text) {
  let result = text;
  for (const [emoji, code] of Object.entries(reverseEmojiMap)) {
    result = result.replaceAll(emoji, code);
  }
  return result;
}

// Convert shortcodes to emojis
function shortcodesToEmojis(text) {
  let result = text;
  for (const [code, emoji] of Object.entries(emojiMap)) {
    result = result.replaceAll(code, emoji);
  }
  return result;
}

// Remove angle bracket content
function removeAngleBrackets(text) {
  return text.replace(/<[^>]*>/g, '');
}

// Disguise message in paragraph
function disguiseMessage(message) {
  const paragraphs = [
    `The system architecture demonstrates ${message} which provides excellent scalability.`,
    `According to recent studies, ${message} shows promising results in performance metrics.`,
    `Implementation details reveal that ${message} offers significant advantages.`,
    `Technical documentation indicates ${message} as a viable solution.`,
    `Analysis suggests that ${message} meets all requirements effectively.`
  ];
  return paragraphs[Math.floor(Math.random() * paragraphs.length)];
}

// Send message to WhatsApp
router.post('/send', sessionMiddleware, async (req, res) => {
  try {
    const { groupId, message } = req.body;
    
    if (!groupId || !message) {
      return res.status(400).json({ error: 'Group ID and message required' });
    }
    
    // Process message: remove angle brackets, convert shortcodes to emojis
    let processedMessage = removeAngleBrackets(message);
    processedMessage = shortcodesToEmojis(processedMessage);
    
    // Send via WhatsApp
    await whatsappService.sendGroupMessage(groupId, processedMessage);
    
    // Store in MongoDB
    await NotepadMessage.create({
      userId: req.user.userId,
      groupId,
      type: 'sent',
      message: processedMessage
    });
    
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Receive message from WhatsApp (called by WhatsApp bot when @prvt command detected)
router.post('/receive', async (req, res) => {
  try {
    const { message, sender, groupId } = req.body;
    
    // Convert emojis to shortcodes
    const processedMessage = emojisToShortcodes(message);
    
    // Find all users who have sent messages to this group and store for them
    const usersInGroup = await NotepadMessage.distinct('userId', { groupId });
    
    // Store message for all users in this group
    const promises = usersInGroup.map(userId => 
      NotepadMessage.create({
        userId,
        groupId,
        type: 'received',
        message: processedMessage,
        sender
      })
    );
    
    await Promise.all(promises);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get message history
router.get('/history', sessionMiddleware, async (req, res) => {
  try {
    const messages = await NotepadMessage.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(MAX_HISTORY);
    
    res.json({ history: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Poll for new messages
router.get('/poll', sessionMiddleware, async (req, res) => {
  try {
    const groupId = req.query.groupId;
    const lastTimestamp = req.query.lastTimestamp ? new Date(req.query.lastTimestamp) : new Date(0);
    
    const query = {
      userId: req.user.userId,
      timestamp: { $gt: lastTimestamp }
    };
    
    if (groupId) {
      query.groupId = groupId;
    }
    
    const newMessages = await NotepadMessage.find(query).sort({ timestamp: 1 });
    
    res.json({ 
      messages: newMessages,
      totalCount: await NotepadMessage.countDocuments({ userId: req.user.userId, groupId })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all messages
router.post('/clear', sessionMiddleware, async (req, res) => {
  try {
    await NotepadMessage.deleteMany({ userId: req.user.userId });
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
