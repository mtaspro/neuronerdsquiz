import express from 'express';
import UserScore from '../models/UserScore.js';
import User from '../models/User.js';
import UserStats from '../models/UserStats.js';

const leaderboardRouter = express.Router();

// GET /leaderboard/general - returns top 50 users with enhanced stats for division ranking
leaderboardRouter.get('/leaderboard/general', async (req, res) => {
  try {
    // Get user stats with populated user data
    const userStats = await UserStats.find({ totalQuizzes: { $gt: 0 } })
      .populate('userId', 'username avatar badges currentStreak bestScore')
      .sort({ averageScore: -1 })
      .limit(50);
    
    const enhancedUsers = userStats.map(stats => {
      const user = stats.userId;
      if (!user) return null;
      
      return {
        username: user.username,
        avatar: user.avatar,
        score: Math.round(stats.averageScore),
        totalQuizzes: stats.totalQuizzes,
        averageScore: stats.averageScore,
        currentStreak: user.currentStreak || 0,
        bestScore: user.bestScore || 0,
        badges: user.badges || stats.currentBadges || []
      };
    }).filter(user => user !== null);
    
    res.json(enhancedUsers);
  } catch (err) {
    console.error('General leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch general leaderboard.' });
  }
});



// GET /leaderboard - legacy endpoint (returns general)
leaderboardRouter.get('/leaderboard', async (req, res) => {
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

export default leaderboardRouter;