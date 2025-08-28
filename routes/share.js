import express from 'express';
import SharedConversation from '../models/SharedConversation.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Generate shareable link for conversation
router.post('/conversation', sessionMiddleware, async (req, res) => {
  try {
    const { messages, title } = req.body;
    const userId = req.user.userId;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Generate unique share ID
    const shareId = generateShareId();
    
    // Create shared conversation
    const sharedConversation = new SharedConversation({
      shareId,
      title: title || 'NeuraX Conversation',
      messages: messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        image: msg.image,
        timestamp: msg.timestamp
      })),
      createdBy: userId
    });

    await sharedConversation.save();

    const shareUrl = `${req.protocol}://${req.get('host')}/share/${shareId}`;
    
    res.json({
      success: true,
      shareId,
      shareUrl,
      title: sharedConversation.title
    });
  } catch (error) {
    console.error('Share conversation error:', error);
    res.status(500).json({ error: 'Failed to create shareable link' });
  }
});

// Get shared conversation by ID
router.get('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    const conversation = await SharedConversation.findOne({ shareId });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Increment view count
    conversation.viewCount += 1;
    await conversation.save();

    res.json({
      success: true,
      conversation: {
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        viewCount: conversation.viewCount
      }
    });
  } catch (error) {
    console.error('Get shared conversation error:', error);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// Generate unique share ID
function generateShareId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;