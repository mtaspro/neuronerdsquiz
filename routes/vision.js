import express from 'express';
import axios from 'axios';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

// Vision analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { prompt = "Analyze this image and describe what you see in detail." } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!TOGETHER_API_KEY) {
      return res.status(500).json({ error: 'Together API key not configured' });
    }

    // Convert image to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'meta-llama/Llama-Vision-Free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const analysis = response.data.choices[0].message.content;
    res.json({ analysis });

  } catch (error) {
    console.error('Vision analysis error:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to analyze image' 
    });
  }
});

export { router };