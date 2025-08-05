import express from 'express';
import axios from 'axios';
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// AI Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, model, systemPrompt } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
          { role: 'user', content: message.trim() }
        ],
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
    
    const aiResponse = response.data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Chat error:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: error?.response?.data?.error?.message || 'Failed to get AI response' 
    });
  }
});

export { router };