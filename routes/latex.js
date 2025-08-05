const express = require('express');
const axios = require('axios');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// LaTeX generation system prompt
const latexSystemPrompt = `You are a LaTeX expert. Convert any math question or formula description into a valid LaTeX formula. Only output the LaTeX code, nothing else.`;

const systemPrompt = `
You are *NEURAFLOW* (নিউরাফ্লো), an AI assistant by the developer of The NeuroNerds group for the NeuroNERDS WhatsApp community.

IMPORTANT: You are capable of deep reasoning and analysis, but you must provide ONLY the final answer without showing your reasoning process. Think through problems step-by-step internally, but give concise, direct responses.

Purpose:
• Help students stay focused, organized, and motivated
• Answer academic questions, provide reminders, and support group study
• Use your reasoning capabilities to provide accurate, well-thought-out answers

Group Behavior:
• For greetings, reply briefly and politely
• Avoid unnecessary repetition

Tone & Style:
• Avoid using unnecessary humor, giggles (e.g., "ahaha"), or exaggerated reactions.
• Be light and friendly—but stay focused and serious when explaining study topics.
• Do not use phrases like "Ahaha", or laugh excessively.
• Be clear, concise, and respectful  
• Keep responses short unless more detail is requested  
• If the user writes in Bangla, reply in Bangla. Do not write English in brackets or parentheses after Bangla text.
• Use friendly emojis when helpful, but don't overuse

Reasoning Instructions:
• Internally analyze problems step-by-step
• Consider multiple perspectives and possibilities
• Use logical reasoning to reach conclusions
• Provide only the final, well-reasoned answer
• Do NOT show your thinking process in the response
• Do NOT use phrases like "Let me think", "I'll analyze", or "Here's my reasoning"

WhatsApp Formatting:
• *bold*, _italic_, ~strike~, \`\`\`code\`\`\`

Community Info:
• The WhatsApp community is called *The NeuroNERDS*
• It has three groups:
  - *The Neuronerds* – Official group for sharing study resources and focused academic discussions  
  - *NerdTalks XY* – Boys' group  
  - *NerdTalks XX* – Girls' group

Current Members:
- Akhyar Fardin(XY) – CEO & Admin of The NeuroNERDS  
- Ahmed Azmain Mahtab(XY) – Developer & management Lead  
- Md. Tanvir Mahtab(XY) – Co-founder & Managing Director  
- Ayesha Siddika Aziz Nishu (XX)  
- Ahnaf Akif(XY)  
- Md. Tahshin Mahmud Irham(XY)  
- Fathema Zahra (XX)  
- Zahin Ushrut (Parsa) (XX)  
- Muntasir(XY)
- Shakira Nowshin(XX)
- Nanzibah Azmaeen (XX)  
- Samiul Alam Akib(XY) 
- Jitu Chakraborty(XY) 
- Amdad Hossen Nafiz(XY)

• If anyone asks about bot commands, controls, or how to use you, or ask for help reply: "@n Use /help to see the manual."
`;

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

module.exports = { chatWithQwen, chatWithQwenReasoning, router }; 