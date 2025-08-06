import express from 'express';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';
import UserScore from '../models/UserScore.js';
import User from '../models/User.js';
import UserQuizRecord from '../models/UserQuizRecord.js';
import BadgeService from '../services/badgeService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import crypto from 'crypto';

const router = express.Router();
const badgeService = new BadgeService();

// Generate quiz ID based on chapter and questions
function generateQuizId(chapter, questions) {
  // Create a hash of the question IDs to create a unique quiz identifier
  const questionIds = questions.map(q => q._id).sort().join(',');
  const hash = crypto.createHash('md5').update(`${chapter}-${questionIds}`).digest('hex');
  return `${chapter}-${hash.substring(0, 8)}`;
}

// Get all active chapters (filtered by visibility for regular users)
router.get('/chapters', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let filter = { isActive: true };
    
    // If not admin, only show visible chapters
    if (!user || !user.isAdmin) {
      filter.visible = true;
    }
    
    const chapters = await Chapter.find(filter).sort('order');
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

// Check if user has already attempted a quiz
router.post('/check-attempt', authMiddleware, async (req, res) => {
  try {
    const { chapter, questions } = req.body;
    const userId = req.user.userId;
    
    if (!chapter || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Chapter and questions are required' });
    }
    
    // Generate quiz ID
    const quizId = generateQuizId(chapter, questions);
    
    // Check if chapter is in practice mode
    const chapterDoc = await Chapter.findOne({ name: chapter });
    const isChapterPracticeMode = chapterDoc?.practiceMode === true;
    
    // Check if user has already attempted this quiz
    const existingRecord = await UserQuizRecord.findOne({ userId, quizId });
    
    res.json({
      hasAttempted: !!existingRecord,
      quizId,
      practiceMode: isChapterPracticeMode,
      previousAttempt: existingRecord ? {
        score: existingRecord.score,
        submittedAt: existingRecord.submittedAt,
        totalQuestions: existingRecord.totalQuestions,
        correctAnswers: existingRecord.correctAnswers
      } : null
    });
    
  } catch (error) {
    console.error('Error checking quiz attempt:', error);
    res.status(500).json({ error: 'Failed to check quiz attempt' });
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
      answers,
      questions // Array of question objects used in the quiz
    } = req.body;
    
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Generate quiz ID
    const quizId = generateQuizId(chapter, questions);
    
    console.log(`📝 Quiz submitted by ${user.username}: ${score}/${totalQuestions} in ${timeSpent}ms (Quiz ID: ${quizId})`);

    // Check if chapter is in practice mode
    const chapterDoc = await Chapter.findOne({ name: chapter });
    const isChapterPracticeMode = chapterDoc?.practiceMode === true;
    
    // Check if user has already attempted this quiz
    const existingRecord = await UserQuizRecord.findOne({ userId, quizId });
    
    let isFirstAttempt = !existingRecord;
    let practiceMode = isChapterPracticeMode || !!existingRecord;
    
    if (practiceMode) {
      // This is either a repeat attempt or chapter is in practice mode
      const reason = isChapterPracticeMode ? 'chapter is in practice mode' : 'repeat attempt';
      console.log(`🔄 Practice attempt by ${user.username} for quiz ${quizId} (${reason})`);
      
      return res.json({
        message: `Quiz completed in practice mode (${reason})`,
        practiceMode: true,
        isFirstAttempt: false,
        currentScore: score,
        previousBestScore: existingRecord?.score || 0,
        improved: existingRecord ? score > existingRecord.score : false,
        leaderboardUpdated: false,
        badgesUpdated: false
      });
    }

    // This is the first attempt - record it and update stats
    try {
      // Create quiz record
      const quizRecord = new UserQuizRecord({
        userId,
        username: user.username,
        quizId,
        chapter,
        score,
        totalQuestions,
        correctAnswers,
        timeSpent,
        answers: answers.map((answer, index) => ({
          questionIndex: index,
          selectedAnswer: answer,
          isCorrect: questions[index] && (
            (typeof questions[index].correctAnswerIndex === 'number' && answer === questions[index].correctAnswerIndex) ||
            (typeof questions[index].correctAnswer === 'string' && questions[index].options[answer] === questions[index].correctAnswer)
          ),
          timeSpent: Math.floor(timeSpent / totalQuestions) // Approximate time per question
        })),
        isFirstAttempt: true
      });

      await quizRecord.save();
      console.log(`✅ First attempt recorded for ${user.username} - Quiz ID: ${quizId}`);

    } catch (recordError) {
      if (recordError.code === 11000) {
        // Duplicate key error - someone else submitted at the same time
        console.log(`⚠️ Concurrent submission detected for ${user.username} - Quiz ID: ${quizId}`);
        return res.json({
          message: 'Quiz completed in practice mode (concurrent submission)',
          practiceMode: true,
          isFirstAttempt: false,
          currentScore: score,
          leaderboardUpdated: false,
          badgesUpdated: false
        });
      }
      throw recordError;
    }

    // Update or create leaderboard entry (only for first attempts)
    let userScore = await UserScore.findOne({ username: user.username });
    let leaderboardUpdated = false;
    
    if (userScore) {
      // Update if new score is higher
      if (score > userScore.score) {
        userScore.score = score;
        await userScore.save();
        leaderboardUpdated = true;
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
      leaderboardUpdated = true;
      console.log(`🆕 Added ${user.username} to leaderboard: ${score}`);
    }

    // Update user stats and recalculate badges (only for first attempts)
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
      practiceMode: false,
      isFirstAttempt: true,
      currentScore: score,
      leaderboardUpdated,
      badgesUpdated: true,
      newScore: score,
      currentBadges: userBadges
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get user's quiz history
router.get('/my-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chapter, limit = 10 } = req.query;
    
    const filter = { userId };
    if (chapter) filter.chapter = chapter;
    
    const history = await UserQuizRecord.find(filter)
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .select('quizId chapter score totalQuestions correctAnswers timeSpent submittedAt isFirstAttempt');
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({ error: 'Failed to fetch quiz history' });
  }
});

// Get quiz statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all quiz records for the user
    const allRecords = await UserQuizRecord.find({ userId });
    const firstAttempts = allRecords.filter(record => record.isFirstAttempt);
    
    const stats = {
      totalQuizzes: allRecords.length,
      firstAttempts: firstAttempts.length,
      practiceAttempts: allRecords.length - firstAttempts.length,
      averageScore: firstAttempts.length > 0 
        ? firstAttempts.reduce((sum, record) => sum + record.score, 0) / firstAttempts.length 
        : 0,
      bestScore: firstAttempts.length > 0 
        ? Math.max(...firstAttempts.map(record => record.score)) 
        : 0,
      totalCorrectAnswers: firstAttempts.reduce((sum, record) => sum + record.correctAnswers, 0),
      averageTimePerQuiz: firstAttempts.length > 0 
        ? firstAttempts.reduce((sum, record) => sum + record.timeSpent, 0) / firstAttempts.length 
        : 0,
      chapterBreakdown: {}
    };
    
    // Chapter-wise breakdown
    firstAttempts.forEach(record => {
      if (!stats.chapterBreakdown[record.chapter]) {
        stats.chapterBreakdown[record.chapter] = {
          attempts: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0
        };
      }
      
      const chapterStats = stats.chapterBreakdown[record.chapter];
      chapterStats.attempts++;
      chapterStats.totalScore += record.score;
      chapterStats.averageScore = chapterStats.totalScore / chapterStats.attempts;
      chapterStats.bestScore = Math.max(chapterStats.bestScore, record.score);
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    res.status(500).json({ error: 'Failed to fetch quiz stats' });
  }
});

export default router;