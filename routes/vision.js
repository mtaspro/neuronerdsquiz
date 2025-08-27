import express from 'express';
import axios from 'axios';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Vision analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { prompt = "Analyze this image and describe what you see in detail." } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Convert image to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    let response;
    
    // Use best Bengali-supporting vision models with fallback
    console.log('Using OpenRouter for vision analysis...');
    
    const models = [
      'qwen/qwen2.5-vl-72b-instruct:free',  // Best for Bengali + vision
      'google/gemini-2.0-flash-exp:free',   // Strong multilingual
      'meta-llama/llama-3.2-11b-vision-instruct:free' // Reliable fallback
    ];
    
    let lastError;
    
    for (const model of models) {
      try {
        console.log(`Trying vision model: ${model}`);
        
        response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: model,
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
            max_tokens: 1500,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://neuronerdsquiz.vercel.app',
              'X-Title': 'NeuraX Vision Analysis'
            }
          }
        );
        
        console.log(`✅ Vision successful with ${model}`);
        break;
        
      } catch (modelError) {
        console.log(`❌ ${model} failed: ${modelError.response?.status}`);
        lastError = modelError;
        continue;
      }
    }
    
    if (!response) {
      throw lastError;
    }

    const analysis = response.data.choices[0].message.content;
    res.json({ analysis });

  } catch (error) {
    console.error('Vision error:', error.response?.status, error.response?.data?.error?.message || error.message);
    res.status(500).json({ 
      error: error?.response?.data?.error?.message || error.message || 'Failed to analyze image'
    });
  }
});

export { router };