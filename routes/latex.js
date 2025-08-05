import express from 'express';
import axios from 'axios';
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// LaTeX generation system prompt
const latexSystemPrompt = `You are a LaTeX expert. Convert any math question or formula description into a valid LaTeX formula for mathjax rendering. Only output the LaTeX code, nothing else, not even what you are reasoning.`;

// LaTeX generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { text } = req.body;
    
    console.log('LaTeX generation request:', { text: text?.substring(0, 50) });
    console.log('OPENROUTER_API_KEY present:', !!OPENROUTER_API_KEY);
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is missing from environment variables');
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: latexSystemPrompt },
          { role: 'user', content: text.trim() }
        ],
        temperature: 0.3,
        max_tokens: 500,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/mtaspro/neuronerds-quiz',
          'X-Title': 'Neuronerds Quiz LaTeX Generator'
        }
      }
    );
    
    const latex = response.data.choices?.[0]?.message?.content?.trim();
    
    if (!latex) {
      return res.status(500).json({ error: 'Failed to generate LaTeX' });
    }

    res.json({ latex });
  } catch (error) {
    console.error('LaTeX generation error:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: error?.response?.data?.error?.message || 'Failed to generate LaTeX' 
    });
  }
});

export { router }; 