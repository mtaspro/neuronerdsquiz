const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');

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

module.exports = router;