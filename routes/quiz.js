import express from 'express';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// GET /api/quizzes?chapter=Chapter-1&subject=Math&difficulty=Easy
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