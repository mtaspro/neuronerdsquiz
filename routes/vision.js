import express from 'express';
import axios from 'axios';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const GEMINI_DEFAULT_MODEL = process.env.GEMINI_DEFAULT_MODEL || 'gemini-3.5-flash-lite';

// Vision analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { prompt = "Analyze this image and describe what you see in detail." } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!GEMINI_API_KEY && !GROQ_API_KEY) {
      return res.status(500).json({ error: 'AI API keys (Gemini or Groq) not configured' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    if (GEMINI_API_KEY) {
      console.log('Using Gemini Vision for analysis...');
      const geminiModel = GEMINI_DEFAULT_MODEL;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;

      const response = await axios.post(
        apiUrl,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const candidate = response.data.candidates?.[0];
      const analysis = candidate?.content?.parts?.[0]?.text || '';
      
      if (!analysis) {
        throw new Error('Empty analysis returned from Gemini');
      }

      console.log('✅ Vision analysis successful with Gemini');
      return res.json({ analysis });
    }

    console.log('Using Groq Llama Vision for analysis...');
    
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