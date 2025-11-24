import express from 'express';
import axios from 'axios';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Vision analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { prompt = "Analyze this image and describe what you see in detail." } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    console.log('Using Groq Llama Vision for analysis...');
    
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const analysis = response.data.choices[0].message.content;
    console.log('✅ Vision analysis successful with Groq Llama');
    
    res.json({ analysis });

  } catch (error) {
    console.error('Vision error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message || 'Failed to analyze image'
    });
  }
});

export { router };