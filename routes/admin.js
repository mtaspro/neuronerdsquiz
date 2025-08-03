import express from 'express';
import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import UserScore from '../models/UserScore.js';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';
import UserStats from '../models/UserStats.js';
import Badge from '../models/Badge.js';
import UserQuizRecord from '../models/UserQuizRecord.js';
import BadgeService from '../services/badgeService.js';

const router = express.Router();

// List all users
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// Reset a user's score and stats
router.post('/users/:id/reset-score', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`🔄 Resetting all data for user: ${user.username}`);
    
    // 1. Delete user's scores from leaderboard
    await UserScore.deleteMany({ user: userId });
    await UserScore.deleteMany({ username: user.username });
    console.log('✅ Deleted user scores');
    
    // 2. Delete user's stats (including badge statistics)
    await UserStats.deleteMany({ userId: userId });
    await UserStats.deleteMany({ username: user.username });
    console.log('✅ Deleted user stats');
    
    // 3. Delete user's quiz records
    await UserQuizRecord.deleteMany({ userId: userId });
    console.log('✅ Deleted user quiz records');
    
    // 4. Remove user from any badges they currently hold and recalculate
    const badgeService = new BadgeService();
    await badgeService.recalculateAllBadges();
    console.log('✅ Recalculated all badges');
    
    console.log(`🎉 Successfully reset all data for user: ${user.username}`);
    res.json({ message: `User ${user.username}'s scores, stats, and badges have been reset` });
    
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// Delete a user completely
router.delete('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow deleting admin users
    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    // Delete user's scores from leaderboard
    await UserScore.deleteMany({ username: user.username });
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    console.log(`Admin deleted user: ${user.email} (${user.username})`);
    res.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// List all chapters
router.get('/chapters', authMiddleware, requireAdmin, async (req, res) => {
  const chapters = await Chapter.find().sort('order');
  res.json(chapters);
});

// Add a new chapter
router.post('/chapters', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const chapter = new Chapter(req.body);
    await chapter.save();
    res.status(201).json(chapter);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Chapter name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create chapter' });
    }
  }
});

// Edit a chapter
router.put('/chapters/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Chapter name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update chapter' });
    }
  }
});

// Delete a chapter
router.delete('/chapters/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    // Also delete all questions in this chapter
    await Quiz.deleteMany({ chapter: chapter.name });
    res.json({ message: 'Chapter and its questions deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

// List all questions
router.get('/questions', authMiddleware, requireAdmin, async (req, res) => {
  const questions = await Quiz.find();
  res.json(questions);
});

// Add a new question
router.post('/questions', authMiddleware, requireAdmin, async (req, res) => {
  const q = new Quiz(req.body);
  await q.save();
  res.status(201).json(q);
});

// Edit a question
router.put('/questions/:id', authMiddleware, requireAdmin, async (req, res) => {
  const q = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(q);
});

// Delete a question
router.delete('/questions/:id', authMiddleware, requireAdmin, async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: 'Question deleted' });
});

// Reset leaderboard (delete all scores, stats, badges, and quiz records)
router.post('/leaderboard/reset', authMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Starting complete leaderboard reset...');
    
    // 1. Delete all user scores from leaderboard
    await UserScore.deleteMany({});
    console.log('✅ Deleted all user scores');
    
    // 2. Delete all user stats (including badge statistics)
    await UserStats.deleteMany({});
    console.log('✅ Deleted all user stats');
    
    // 3. Reset all badges (clear current holders and history)
    await Badge.updateMany(
      {},
      {
        $unset: {
          currentHolderId: 1,
          currentHolderUsername: 1,
          currentValue: 1
        },
        $set: {
          previousHolders: [],
          lastUpdated: new Date()
        }
      }
    );
    console.log('✅ Reset all badge holders');
    
    // 4. Delete all quiz attempt records
    await UserQuizRecord.deleteMany({});
    console.log('✅ Deleted all quiz records');
    
    // 5. Re-initialize the badge system to ensure clean state
    const badgeService = new BadgeService();
    await badgeService.initializeBadges();
    console.log('✅ Re-initialized badge system');
    
    console.log('🎉 Complete leaderboard reset successful!');
    res.json({ 
      message: 'Complete leaderboard reset successful! All scores, stats, badges, and quiz records have been cleared.' 
    });
    
  } catch (error) {
    console.error('❌ Error during leaderboard reset:', error);
    res.status(500).json({ 
      error: 'Failed to reset leaderboard completely',
      details: error.message 
    });
  }
});

export default router;