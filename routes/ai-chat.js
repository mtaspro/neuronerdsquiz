import express from 'express';
import axios from 'axios';
import authMiddleware from '../middleware/authMiddleware.js';
import ChatHistory from '../models/ChatHistory.js';
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// AI Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, model, systemPrompt, conversationHistory = [], enableWebSearch = false } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!OPENROUTER_API_KEY && !GROQ_API_KEY && !HUGGINGFACE_API_KEY) {
      return res.status(500).json({ error: 'AI API keys not configured' });
    }

    // Build messages array with conversation history
    let messages = [
      { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
      ...conversationHistory,
      { role: 'user', content: message.trim() }
    ];

    // Determine API endpoint and headers based on model
    const isGroqModel = model === 'qwen/qwen3-32b';
    const isHuggingFaceModel = model.includes('DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion');
    
    let apiUrl, apiKey, headers;
    
    if (isHuggingFaceModel) {
      apiUrl = `https://api-inference.huggingface.co/models/${model}`;
      apiKey = HUGGINGFACE_API_KEY;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
    } else if (isGroqModel) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      apiKey = GROQ_API_KEY;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
    } else {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = OPENROUTER_API_KEY;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
        'X-Title': 'Neuraflow AI Chat'
      };
    }

    // First AI call to check if search is needed
    let requestBody, response;
    
    if (isHuggingFaceModel) {
      // Hugging Face format
      const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      requestBody = {
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      };
    } else {
      // OpenAI format for Groq and OpenRouter
      requestBody = {
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      };
    }
    
    response = await axios.post(apiUrl, requestBody, { headers });
    
    let aiResponse;
    
    if (isHuggingFaceModel) {
      // Hugging Face response format
      aiResponse = response.data[0]?.generated_text?.trim();
    } else {
      // OpenAI format response
      aiResponse = response.data.choices?.[0]?.message?.content?.trim();
    }
    
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
        
        if (isHuggingFaceModel) {
          const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
          requestBody = {
            inputs: prompt,
            parameters: {
              max_new_tokens: 1000,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false
            }
          };
        } else {
          requestBody = {
            model: model || 'meta-llama/llama-3.3-70b-instruct:free',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 0.9
          };
        }
        
        response = await axios.post(apiUrl, requestBody, { headers });
        
        if (isHuggingFaceModel) {
          aiResponse = response.data[0]?.generated_text?.trim();
        } else {
          aiResponse = response.data.choices?.[0]?.message?.content?.trim();
        }
        
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

    // Final cleanup and ensure string response
    const finalResponse = String(aiResponse || 'I apologize, but I encountered an issue processing your request.');
    
    res.json({ response: finalResponse });
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