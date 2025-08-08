import express from 'express';
import authMiddleware, { requireAdmin, requireSuperAdmin } from '../middleware/authMiddleware.js';
import BattleEvent from '../models/BattleEvent.js';
import UserScore from '../models/UserScore.js';

const router = express.Router();

// Get current active event
router.get('/current', async (req, res) => {
  try {
    const currentEvent = await BattleEvent.findOne({
      $or: [{ status: 'active' }, { status: 'upcoming' }],
      startDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      endDate: { $gte: new Date() }
    });
    res.json(currentEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch current event' });
  }
});

// Create new battle event (SuperAdmin only)
router.post('/create', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { title, description, prizeAmount, startDate, endDate } = req.body;
    
    const event = new BattleEvent({
      title,
      description,
      prizeAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: startDate <= new Date() ? 'active' : 'upcoming'
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// End event and declare winner (SuperAdmin only)
router.post('/:id/end', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const event = await BattleEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Find winner (highest battle score during event period)
    const winner = await UserScore.findOne({ 
      type: 'battle',
      updatedAt: { $gte: event.startDate, $lte: event.endDate }
    }).sort({ score: -1 });
    
    if (winner) {
      event.winnerId = winner.userId;
      event.winnerUsername = winner.username;
      event.winnerScore = winner.score;
    }
    
    event.status = 'completed';
    await event.save();
    
    res.json({ message: 'Event ended successfully', winner });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end event' });
  }
});

// Get event leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const event = await BattleEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const leaderboard = await UserScore.find({
      type: 'battle',
      updatedAt: { $gte: event.startDate, $lte: event.endDate }
    }).sort({ score: -1 }).limit(10);
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event leaderboard' });
  }
});

export default router;