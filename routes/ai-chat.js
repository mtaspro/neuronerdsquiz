import express from 'express';
import axios from 'axios';
import authMiddleware from '../middleware/authMiddleware.js';
import ChatHistory from '../models/ChatHistory.js';
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// AI Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, model, systemPrompt, conversationHistory = [], enableWebSearch = false } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Build messages array with conversation history
    let messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
      ...conversationHistory,
      { role: 'user', content: message.trim() }
    ];

    // First AI call to check if search is needed
    let response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
          'X-Title': 'Neuraflow AI Chat'
        }
      }
    );
    
    let aiResponse = response.data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to get AI response' });
    }
    
    // Ensure aiResponse is always a string
    aiResponse = String(aiResponse);

    // Check if AI wants to generate an image
    const imageGenerateMatch = aiResponse.match(/\[GENERATE_IMAGE:\s*(.+?)\]/);
    if (imageGenerateMatch) {
      // Don't process further, let frontend handle image generation
      aiResponse = aiResponse.replace(/\[GENERATE_IMAGE:.*?\]/g, '').trim();
      res.json({ response: aiResponse, generateImage: imageGenerateMatch[1].trim() });
      return;
    }
    
    // Check if AI wants to search the web (either auto-detected or user enabled)
    const searchMatch = aiResponse.match(/\[SEARCH_NEEDED:\s*(.+?)\]/);
    if ((searchMatch || enableWebSearch) && process.env.SERPER_API_KEY) {
      try {
        const searchQuery = searchMatch ? searchMatch[1].trim() : message.trim();
        
        // Perform web search
        const searchResponse = await axios.post(
          'https://google.serper.dev/search',
          {
            q: searchQuery,
            num: 3,
            hl: 'en',
            gl: 'us'
          },
          {
            headers: {
              'X-API-KEY': process.env.SERPER_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const searchResults = searchResponse.data.organic || [];
        const searchContext = searchResults.map(result => 
          `Title: ${result.title}\nSnippet: ${result.snippet}\nSource: ${result.link}`
        ).join('\n\n');
        
        // Second AI call with search results
        messages.push({
          role: 'assistant', 
          content: searchMatch ? '[SEARCH_NEEDED: ' + searchQuery + ']' : 'Let me search for current information.'
        });
        messages.push({
          role: 'user', 
          content: `Here are the current web search results for "${searchQuery}":\n\n${searchContext}\n\nPlease provide a comprehensive answer using this information.`
        });
        
        response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: model || 'meta-llama/llama-3.3-70b-instruct:free',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.9
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
              'X-Title': 'Neuraflow AI Chat'
            }
          }
        );
        
        aiResponse = response.data.choices?.[0]?.message?.content?.trim();
        
        // Ensure aiResponse is always a string
        if (aiResponse) {
          aiResponse = String(aiResponse);
        }
      } catch (searchError) {
        console.error('Web search error:', searchError);
        // Continue with original response if search fails
      }
    }

    // Remove AI reasoning tags and search markers
    aiResponse = aiResponse.replace(/<think>.*?<\/think>/gs, '').trim();
    aiResponse = aiResponse.replace(/\[SEARCH_NEEDED:.*?\]/g, '').trim();
    aiResponse = aiResponse.replace(/\[IMAGE_CONFIRM:.*?\]/g, (match) => {
      // Extract and clean the confirmation message
      const confirmMatch = match.match(/\[IMAGE_CONFIRM:\s*(.+?)\]/);
      return confirmMatch ? confirmMatch[1] + ' - Should I generate this image for you?' : match;
    });
    aiResponse = aiResponse.replace(/\[GENERATE_IMAGE:.*?\]/g, '').trim();

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Chat error:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: error?.response?.data?.error?.message || 'Failed to get AI response' 
    });
  }
});

// Save chat history
router.post('/save-history', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    const userId = req.user.userId;
    
    await ChatHistory.findOneAndUpdate(
      { userId },
      { 
        messages,
        lastUpdated: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: 'Chat history saved' });
  } catch (error) {
    console.error('Save chat history error:', error);
    res.status(500).json({ error: 'Failed to save chat history' });
  }
});

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const chatHistory = await ChatHistory.findOne({ userId });
    
    if (chatHistory) {
      res.json({ messages: chatHistory.messages });
    } else {
      res.json({ messages: [] });
    }
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Get chat history list
router.get('/history-list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const chats = await ChatHistory.find({ userId })
      .select('_id messages createdAt lastUpdated')
      .sort({ lastUpdated: -1 })
      .limit(50);
    
    const chatList = chats.map(chat => ({
      id: chat._id,
      title: chat.messages.length > 0 ? chat.messages[0].content.substring(0, 50) + '...' : 'New Chat',
      lastMessage: chat.lastUpdated,
      messageCount: chat.messages.length
    }));
    
    res.json({ chats: chatList });
  } catch (error) {
    console.error('Get chat list error:', error);
    res.status(500).json({ error: 'Failed to get chat list' });
  }
});

// Get specific chat history
router.get('/history/:chatId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    
    const chat = await ChatHistory.findOne({ _id: chatId, userId });
    
    if (chat) {
      res.json({ messages: chat.messages });
    } else {
      res.status(404).json({ error: 'Chat not found' });
    }
  } catch (error) {
    console.error('Get specific chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await ChatHistory.deleteMany({ userId });
    
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export { router };