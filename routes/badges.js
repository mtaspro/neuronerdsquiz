import express from 'express';
import BadgeService from '../services/badgeService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import UserStats from '../models/UserStats.js';
import Badge from '../models/Badge.js';

const router = express.Router();
const badgeService = new BadgeService();

// Initialize badges (run once)
router.post('/initialize', async (req, res) => {
  try {
    await badgeService.initializeBadges();
    res.json({ message: 'Badges initialized successfully' });
  } catch (error) {
    console.error('Error initializing badges:', error);
    res.status(500).json({ error: 'Failed to initialize badges' });
  }
});

// Get all badges with current holders
router.get('/all', async (req, res) => {
  try {
    const badges = await badgeService.getAllBadges();
    res.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Get user's current badges
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = await badgeService.getUserBadges(userId);
    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// Get current user's badges
router.get('/my-badges', authMiddleware, async (req, res) => {
  try {
    const badges = await badgeService.getUserBadges(req.user.userId);
    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ error: 'Failed to fetch user badges' });
  }
});

// Get user's stats and badge history
router.get('/stats/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      return res.json({
        currentBadges: [],
        badgeHistory: [],
        stats: {
          totalQuizzes: 0,
          totalCorrectAnswers: 0,
          averageScore: 0,
          battlesWon: 0,
          totalBattles: 0
        }
      });
    }
    
    res.json({
      currentBadges: userStats.currentBadges,
      badgeHistory: userStats.badgeHistory,
      stats: {
        totalQuizzes: userStats.totalQuizzes,
        totalCorrectAnswers: userStats.totalCorrectAnswers,
        totalQuestions: userStats.totalQuestions,
        averageScore: userStats.averageScore,
        battlesWon: userStats.battlesWon,
        totalBattles: userStats.totalBattles,
        battleWinRate: userStats.battleWinRate,
        averageTimePerQuiz: userStats.averageTimePerQuiz,
        fastestQuizTime: userStats.fastestQuizTime
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get current user's stats
router.get('/my-stats', authMiddleware, async (req, res) => {
  try {
    const userStats = await UserStats.findOne({ userId: req.user.userId });
    
    if (!userStats) {
      return res.json({
        currentBadges: [],
        badgeHistory: [],
        stats: {
          totalQuizzes: 0,
          totalCorrectAnswers: 0,
          averageScore: 0,
          battlesWon: 0,
          totalBattles: 0
        }
      });
    }
    
    res.json({
      currentBadges: userStats.currentBadges,
      badgeHistory: userStats.badgeHistory,
      stats: {
        totalQuizzes: userStats.totalQuizzes,
        totalCorrectAnswers: userStats.totalCorrectAnswers,
        totalQuestions: userStats.totalQuestions,
        averageScore: userStats.averageScore,
        battlesWon: userStats.battlesWon,
        totalBattles: userStats.totalBattles,
        battleWinRate: userStats.battleWinRate,
        averageTimePerQuiz: userStats.averageTimePerQuiz,
        fastestQuizTime: userStats.fastestQuizTime
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get badge leaderboard
router.get('/leaderboard/:badgeName', async (req, res) => {
  try {
    const { badgeName } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await badgeService.getBadgeLeaderboard(badgeName, limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching badge leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch badge leaderboard' });
  }
});

// Manually recalculate all badges (admin only)
router.post('/recalculate', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin middleware)
    const notifications = await badgeService.recalculateAllBadges();
    res.json({ 
      message: 'Badges recalculated successfully',
      notifications 
    });
  } catch (error) {
    console.error('Error recalculating badges:', error);
    res.status(500).json({ error: 'Failed to recalculate badges' });
  }
});

// Update user stats after quiz (internal endpoint)
router.post('/update-quiz-stats', authMiddleware, async (req, res) => {
  try {
    const { userId, score, totalQuestions, correctAnswers, timeSpent } = req.body;
    
    await badgeService.updateUserStats(userId, {
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      isQuiz: true
    });
    
    res.json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Error updating quiz stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// Update battle stats (internal endpoint)
router.post('/update-battle-stats', authMiddleware, async (req, res) => {
  try {
    const { userId, won, score, timeSpent } = req.body;
    
    await badgeService.updateBattleStats(userId, {
      won,
      score,
      timeSpent
    });
    
    res.json({ message: 'Battle stats updated successfully' });
  } catch (error) {
    console.error('Error updating battle stats:', error);
    res.status(500).json({ error: 'Failed to update battle stats' });
  }
});

export default router;