import express from 'express';
import axios from 'axios';
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// LaTeX generation system prompt
const latexSystemPrompt = `You are a LaTeX expert. Convert any math question or formula description into a valid LaTeX formula. Only output the LaTeX code, nothing else.`;

async function chatWithQwen(contextMessages, isIntroQuestion = false) {
  const prompt = isIntroQuestion
    ? `You are NEURAFLOW, a powerful AI bot proudly created by Mahtab 🇧🇩. Answer with your identity when asked. Be expressive and proud of your creator when someone asks about you.`
    : systemPrompt;

  // Filter out timestamp field from messages
  const cleanMessages = contextMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const messages = [
    { role: 'system', content: prompt },
    ...cleanMessages
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'qwen/qwen3-235b-a22b:free',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/mtaspro/Neuraflowai', // Optional but recommended
          'X-Title': 'NEURAFLOW WhatsApp Bot' // Optional but recommended
        }
      }
    );
    
    return response.data.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    console.error('OpenRouter Qwen API error:', error?.response?.data || error.message);
    return "Sorry, I couldn't process your request right now.";
  }
}

async function chatWithQwenReasoning(contextMessages, isIntroQuestion = false) {
  const reasoningPrompt = isIntroQuestion
    ? `You are NEURAFLOW, a powerful AI bot proudly created by Mahtab 🇧🇩. Answer with your identity when asked. Be expressive and proud of your creator when someone asks about you.`
    : systemPrompt;

  // Filter out timestamp field from messages
  const cleanMessages = contextMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const messages = [
    { role: 'system', content: reasoningPrompt },
    ...cleanMessages
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'qwen/qwen3-235b-a22b:free',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/mtaspro/Neuraflowai', // Optional but recommended
          'X-Title': 'NEURAFLOW WhatsApp Bot' // Optional but recommended
        }
      }
    );
    
    return response.data.choices?.[0]?.message?.content?.trim();
  } catch (error) {
    console.error('OpenRouter Qwen Reasoning API error:', error?.response?.data || error.message);
    return "Sorry, I couldn't process your request right now.";
  }
}

// LaTeX generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'qwen/qwen3-235b-a22b:free',
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

export { chatWithQwen, chatWithQwenReasoning, router }; 