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

    if (!process.env.DEEPAI_API_KEY) {
      return res.status(500).json({ error: 'Image generation service not configured' });
    }

    // Use DeepAI text-to-image API
    const response = await axios.post('https://api.deepai.org/api/text2img', {
      text: trimmedPrompt
    }, {
      headers: {
        'Api-Key': process.env.DEEPAI_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (!response.data || !response.data.output_url) {
      throw new Error('Invalid response from DeepAI');
    }

    const imageUrl = response.data.output_url;
    console.log('✅ Generated image with DeepAI:', imageUrl);
    
    res.json({ imageUrl, prompt: trimmedPrompt });
  } catch (error) {
    console.error('Image generation error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Authentication failed. Service temporarily unavailable.' });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({ error: 'The selected model does not support image generation. Please contact support.' });
    }
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Request timeout. Please try again.' });
    }
    
    res.status(500).json({ error: 'Image generation service is currently unavailable. The model may not support image generation.' });
  }
});

export default router;