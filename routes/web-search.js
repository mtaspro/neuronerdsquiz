import express from 'express';
import axios from 'axios';
const router = express.Router();

const SERPER_API_KEY = process.env.SERPER_API_KEY;

// Web search endpoint
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!SERPER_API_KEY) {
      return res.status(500).json({ error: 'Serper API key not configured' });
    }

    const response = await axios.post(
      'https://google.serper.dev/search',
      {
        q: query.trim(),
        num: 5,
        hl: 'en',
        gl: 'us'
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const results = response.data.organic || [];
    const formattedResults = results.map(result => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    }));

    res.json({ results: formattedResults });
  } catch (error) {
    console.error('Web search error:', error?.response?.data || error.message);
    res.status(500).json({ 
      error: error?.response?.data?.message || 'Failed to perform web search' 
    });
  }
});

export { router };