import express from 'express';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';

const router = express.Router();

// Get all active chapters
router.get('/chapters', async (req, res) => {
  try {
    const chapters = await Chapter.find({ isActive: true }).sort('order');
    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get quizzes with filters
router.get('/', async (req, res) => {
  try {
    const { chapter, subject, difficulty } = req.query;
    const filter = {};
    if (chapter) filter.chapter = chapter;
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    const quizzes = await Quiz.find(filter);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;