import express from 'express';
import whatsappService from '../services/whatsappService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Store message history in memory (you can use MongoDB if needed)
const messageHistory = [];
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
router.post('/send', authMiddleware, async (req, res) => {
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
    
    // Store in history
    messageHistory.push({
      type: 'sent',
      message: processedMessage,
      timestamp: new Date()
    });
    
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Receive message from WhatsApp (called by WhatsApp bot when @prvt command detected)
router.post('/receive', async (req, res) => {
  try {
    const { message, sender } = req.body;
    
    // Convert emojis to shortcodes
    const processedMessage = emojisToShortcodes(message);
    
    // Store in history
    messageHistory.push({
      type: 'received',
      message: processedMessage,
      sender,
      timestamp: new Date()
    });
    
    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get message history
router.get('/history', authMiddleware, (req, res) => {
  try {
    res.json({ history: messageHistory.slice(-10) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Poll for new messages
router.get('/poll', authMiddleware, (req, res) => {
  try {
    const lastId = parseInt(req.query.lastId) || 0;
    const newMessages = messageHistory.slice(lastId);
    
    res.json({ 
      messages: newMessages.map((msg, idx) => ({
        ...msg,
        id: lastId + idx
      })),
      totalCount: messageHistory.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all messages
router.post('/clear', authMiddleware, (req, res) => {
  try {
    messageHistory.length = 0;
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
