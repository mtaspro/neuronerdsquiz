import express from 'express';
import UserScore from '../models/UserScore.js';

const leaderboardRouter = express.Router();

// GET /leaderboard - returns top 10 users sorted by score (highest first)
leaderboardRouter.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await UserScore.find({})
      .sort({ score: -1 })
      .limit(10)
      .select('username score avatar -_id');
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// POST /score - creates or updates a user's score based on their username
leaderboardRouter.post('/score', async (req, res) => {
  const { username, score, avatar } = req.body;

  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof score !== 'number' ||
    typeof avatar !== 'string' ||
    !avatar.trim()
  ) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  try {
    // Find user by username and update if exists, otherwise create new
    const updated = await UserScore.findOneAndUpdate(
      { username: username.trim() },
      { $set: { score, avatar: avatar.trim() } },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Score submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit score.' });
  }
});

export default leaderboardRouter;