import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Vision analysis endpoint
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { prompt = "Analyze this image and describe what you see in detail." } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!GOOGLE_AI_API_KEY) {
      return res.status(500).json({ error: 'Google AI API key not configured' });
    }

    console.log('Using Google Gemini for vision analysis...');
    
    const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      },
      { text: prompt }
    ]);
    
    const analysis = result.response.text();
    console.log('✅ Vision analysis successful with Gemini');
    
    res.json({ analysis });

  } catch (error) {
    console.error('Vision error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze image'
    });
  }
});

export { router };