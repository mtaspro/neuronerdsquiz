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

    if (!TOGETHER_API_KEY && !OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Vision API keys not configured' });
    }

    // Convert image to base64
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    let response;
    
    // Try Together API first
    if (TOGETHER_API_KEY) {
      try {
        console.log('Sending vision request to Together API...');
        
        response = await axios.post(
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
            max_tokens: 1500,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${TOGETHER_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (togetherError) {
        console.log('Together API failed, trying OpenRouter...');
        if (!OPENROUTER_API_KEY) throw togetherError;
        
        // Fallback to OpenRouter
        response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'meta-llama/llama-3.2-90b-vision-instruct:free',
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
              'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
              'X-Title': 'NeuraX Vision Analysis'
            }
          }
        );
      }
    } else {
      // Use OpenRouter directly
      console.log('Using OpenRouter for vision analysis...');
      response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.2-90b-vision-instruct:free',
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
            'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
            'X-Title': 'NeuraX Vision Analysis'
          }
        }
      );
    }

    const analysis = response.data.choices[0].message.content;
    res.json({ analysis });

  } catch (error) {
    console.error('Vision analysis error:', {
      message: error.message,
      response: error?.response?.data,
      status: error?.response?.status,
      apiKey: TOGETHER_API_KEY ? 'Present' : 'Missing'
    });
    res.status(500).json({ 
      error: error?.response?.data?.error?.message || error.message || 'Failed to analyze image'
    });
  }
});

export { router };