import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 3) {
      return res.status(400).json({ error: 'Prompt must be at least 3 characters long' });
    }

    if (trimmedPrompt.length > 500) {
      return res.status(400).json({ error: 'Prompt must be less than 500 characters' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Image generation service not configured' });
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'google/gemini-2.5-flash-image-preview:free',
      messages: [
        {
          role: 'user',
          content: `Generate an image: ${trimmedPrompt}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const imageUrl = response.data.choices[0]?.message?.content;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(500).json({ error: 'Invalid response from image generation service' });
    }

    res.json({ imageUrl, prompt: trimmedPrompt });
  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Authentication failed. Service temporarily unavailable.' });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout. Please try again.' });
    }
    
    res.status(500).json({ error: 'Image generation failed. Please try again later.' });
  }
});

export default router;