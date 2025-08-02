import express from 'express';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';
import UserScore from '../models/UserScore.js';
import User from '../models/User.js';
import BadgeService from '../services/badgeService.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
const badgeService = new BadgeService();

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

// Get questions by chapter
router.get('/questions', async (req, res) => {
  try {
    const { chapter } = req.query;
    if (!chapter) {
      return res.status(400).json({ error: 'Chapter parameter is required' });
    }
    
    const questions = await Quiz.find({ chapter });
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit quiz results
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { 
      score, 
      totalQuestions, 
      correctAnswers, 
      timeSpent, 
      chapter,
      answers 
    } = req.body;
    
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`📝 Quiz submitted by ${user.username}: ${score}/${totalQuestions} in ${timeSpent}ms`);

    // Update or create leaderboard entry
    let userScore = await UserScore.findOne({ username: user.username });
    
    if (userScore) {
      // Update if new score is higher
      if (score > userScore.score) {
        userScore.score = score;
        await userScore.save();
        console.log(`📈 Updated leaderboard score for ${user.username}: ${score}`);
      }
    } else {
      // Create new leaderboard entry
      userScore = new UserScore({
        username: user.username,
        score: score,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`
      });
      await userScore.save();
      console.log(`🆕 Added ${user.username} to leaderboard: ${score}`);
    }

    // Update user stats and recalculate badges
    await badgeService.updateUserStats(userId, {
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      isQuiz: true
    });

    // Get updated user badges for response
    const userBadges = await badgeService.getUserBadges(userId);

    res.json({ 
      message: 'Quiz submitted successfully',
      leaderboardUpdated: true,
      newScore: score,
      currentBadges: userBadges
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;