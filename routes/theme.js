import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import User from '../models/User.js';
import GlobalSettings from '../models/GlobalSettings.js';

const router = express.Router();

// Get user's effective theme (personal or global default)
router.get('/current', sessionMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user.selectedTheme) {
      return res.json({ theme: user.selectedTheme, source: 'personal' });
    }
    
    // Get global default
    const globalTheme = await GlobalSettings.findOne({ settingKey: 'defaultTheme' });
    const theme = globalTheme?.settingValue || 'tech-bg';
    
    res.json({ theme, source: 'global' });
  } catch (error) {
    console.error('Error getting theme:', error);
    res.status(500).json({ error: 'Failed to get theme' });
  }
});

// Set user's personal theme
router.post('/set', sessionMiddleware, async (req, res) => {
  try {
    const { theme } = req.body;
    
    await User.findByIdAndUpdate(req.user.userId, { selectedTheme: theme });
    
    res.json({ message: 'Theme updated successfully' });
  } catch (error) {
    console.error('Error setting theme:', error);
    res.status(500).json({ error: 'Failed to set theme' });
  }
});

export default router;