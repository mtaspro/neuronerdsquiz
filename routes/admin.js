const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const UserScore = require('../models/UserScore');
const Quiz = require('../models/Quiz');

// List all users
router.get('/users', requireAdmin, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// Reset a user's score
router.post('/users/:id/reset-score', requireAdmin, async (req, res) => {
  await UserScore.deleteMany({ user: req.params.id });
  res.json({ message: 'User score reset' });
});

// List all questions
router.get('/questions', requireAdmin, async (req, res) => {
  const questions = await Quiz.find();
  res.json(questions);
});

// Add a new question
router.post('/questions', requireAdmin, async (req, res) => {
  const q = new Quiz(req.body);
  await q.save();
  res.status(201).json(q);
});

// Edit a question
router.put('/questions/:id', requireAdmin, async (req, res) => {
  const q = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(q);
});

// Delete a question
router.delete('/questions/:id', requireAdmin, async (req, res) => {
  await Quiz.findByIdAndDelete(req.params.id);
  res.json({ message: 'Question deleted' });
});

// Reset leaderboard (delete all scores)
router.post('/leaderboard/reset', requireAdmin, async (req, res) => {
  await UserScore.deleteMany({});
  res.json({ message: 'Leaderboard reset' });
});

module.exports = router;