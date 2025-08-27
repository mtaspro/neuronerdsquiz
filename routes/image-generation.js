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

    // Use Pollinations.ai with better validation
    const encodedPrompt = encodeURIComponent(trimmedPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${Date.now()}&nologo=true`;
    
    // Actually download and validate the image
    try {
      const imageResponse = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const imageBuffer = Buffer.from(imageResponse.data);
      
      if (imageBuffer.length < 1000) {
        throw new Error('Generated image is too small or invalid');
      }
      
      console.log('✅ Generated and validated image URL:', imageUrl);
      console.log('✅ Image size:', imageBuffer.length, 'bytes');
      
      res.json({ imageUrl, prompt: trimmedPrompt });
    } catch (testError) {
      console.error('❌ Image generation failed:', testError.message);
      return res.status(500).json({ error: 'Failed to generate valid image. Please try again.' });
    }
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