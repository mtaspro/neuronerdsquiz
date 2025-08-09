import express from 'express';
import axios from 'axios';
const router = express.Router();

// Image generation endpoint using Hugging Face
router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    // Use Hugging Face's free Stable Diffusion model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        inputs: prompt.trim(),
        parameters: {
          negative_prompt: "blurry, bad quality, distorted, ugly, low resolution",
          num_inference_steps: 20,
          guidance_scale: 7.5,
          width: 512,
          height: 512
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      }
    );
    
    // Convert image buffer to base64
    const imageBuffer = Buffer.from(response.data);
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;

    res.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error?.response?.data || error.message);
    
    // Handle rate limiting or model loading
    if (error?.response?.status === 503) {
      return res.status(503).json({ 
        error: 'Image generation model is loading. Please try again in a few moments.' 
      });
    }
    
    if (error?.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment before generating another image.' 
      });
    }
    
    res.status(500).json({ 
      error: error?.response?.data?.error || 'Failed to generate image' 
    });
  }
});

export { router };