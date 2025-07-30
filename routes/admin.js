import express from 'express';
import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import UserScore from '../models/UserScore.js';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';

const router = express.Router();

// List all users
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// Reset a user's score
router.post('/users/:id/reset-score', authMiddleware, requireAdmin, async (req, res) => {
  await UserScore.deleteMany({ user: req.params.id });
  res.json({ message: 'User score reset' });
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

// Reset leaderboard (delete all scores)
router.post('/leaderboard/reset', authMiddleware, requireAdmin, async (req, res) => {
  await UserScore.deleteMany({});
  res.json({ message: 'Leaderboard reset' });
});

export default router;