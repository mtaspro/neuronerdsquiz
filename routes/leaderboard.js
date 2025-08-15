import express from 'express';
import UserScore from '../models/UserScore.js';
import User from '../models/User.js';
import UserStats from '../models/UserStats.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';

const leaderboardRouter = express.Router();

// GET /leaderboard/general - returns top 50 users with enhanced stats for division ranking
leaderboardRouter.get('/leaderboard/general', async (req, res) => {
  try {
    // Get user stats with populated user data (including users with 0 quizzes)
    const userStats = await UserStats.find({})
      .populate('userId', 'username avatar badges currentStreak bestScore')
      .sort({ averageScore: -1, totalQuizzes: -1 })
      .limit(50);
    
    let enhancedUsers = userStats.map(stats => {
      const user = stats.userId;
      if (!user) return null;
      
      return {
        username: user.username,
        avatar: user.avatar,
        score: Math.round(stats.averageScore || 0),
        totalQuizzes: stats.totalQuizzes || 0,
        averageScore: stats.averageScore || 0,
        currentStreak: user.currentStreak || 0,
        bestScore: user.bestScore || 0,
        badges: user.badges || stats.currentBadges || []
      };
    }).filter(user => user !== null);
    
    // If no users with quiz data, show all registered users as Amateur
    if (enhancedUsers.length === 0) {
      const allUsers = await User.find({})
        .select('username avatar badges currentStreak bestScore')
        .limit(50);
      
      enhancedUsers = allUsers.map(user => ({
        username: user.username,
        avatar: user.avatar,
        score: 0,
        totalQuizzes: 0,
        averageScore: 0,
        currentStreak: 0,
        bestScore: 0,
        badges: user.badges || []
      }));
    }
    
    res.json(enhancedUsers);
  } catch (err) {
    console.error('General leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch general leaderboard.' });
  }
});

// GET /leaderboard/battle - returns top 50 users with enhanced battle stats
leaderboardRouter.get('/leaderboard/battle', async (req, res) => {
  try {
    // Get battle scores with user stats
    const battleUsers = await UserScore.find({ type: 'battle' })
      .populate('userId', 'username avatar badges currentStreak')
      .sort({ score: -1 })
      .limit(50);
    
    const enhancedUsers = await Promise.all(battleUsers.map(async (userScore) => {
      const user = userScore.userId;
      if (!user) return null;
      
      // Get user stats for battle data
      const userStats = await UserStats.findOne({ userId: user._id });
      
      return {
        username: user.username,
        avatar: user.avatar,
        score: userScore.score,
        battlesWon: userStats?.battlesWon || 0,
        totalBattles: userStats?.totalBattles || 0,
        winRate: userStats?.battleWinRate || 0,
        streak: user.currentStreak || 0,
        badges: user.badges || userStats?.currentBadges || []
      };
    }));
    
    // Filter out null entries and return
    const validUsers = enhancedUsers.filter(user => user !== null);
    res.json(validUsers);
  } catch (err) {
    console.error('Battle leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch battle leaderboard.' });
  }
});

// GET /leaderboard - legacy endpoint (returns general)
leaderboardRouter.get('/leaderboard', sessionMiddleware, async (req, res) => {
  try {
    const topUsers = await UserScore.find({ type: { $ne: 'battle' } })
      .sort({ score: -1 })
      .limit(10)
      .select('username score avatar -_id');
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// POST /score - creates or updates a user's score based on their userId
leaderboardRouter.post('/score', async (req, res) => {
  const { userId, username, score, avatar } = req.body;

  if (
    !userId ||
    typeof username !== 'string' ||
    !username.trim() ||
    typeof score !== 'number' ||
    typeof avatar !== 'string' ||
    !avatar.trim()
  ) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    // Find user by userId and update if exists, otherwise create new
    const updated = await UserScore.findOneAndUpdate(
      { userId },
      { $set: { username: username.trim(), score, avatar: avatar.trim() } },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Score submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit score.' });
  }
});

// POST /battle-score - creates or updates a user's battle score
leaderboardRouter.post('/battle-score', sessionMiddleware, async (req, res) => {
  try {
    const { score, won } = req.body;
    const userId = req.user.userId;
    
    if (typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score.' });
    }
    
    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Update or create battle score
    await UserScore.findOneAndUpdate(
      { userId, type: 'battle' },
      { 
        $set: { 
          username: user.username, 
          score, 
          avatar: user.avatar,
          type: 'battle'
        } 
      },
      { upsert: true, new: true }
    );
    
    // Update user stats
    const userStats = await UserStats.findOneAndUpdate(
      { userId },
      { 
        $inc: { 
          totalBattles: 1,
          battlesWon: won ? 1 : 0
        }
      },
      { upsert: true, new: true }
    );
    
    // Calculate win rate
    const winRate = userStats.totalBattles > 0 ? (userStats.battlesWon / userStats.totalBattles) * 100 : 0;
    await UserStats.findOneAndUpdate(
      { userId },
      { $set: { battleWinRate: winRate } }
    );
    
    res.status(201).json({ message: 'Battle score submitted successfully.' });
  } catch (err) {
    console.error('Battle score submission error:', err);
    res.status(500).json({ error: 'Failed to submit battle score.' });
  }
});

export default leaderboardRouter;