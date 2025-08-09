import express from 'express';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';
import UserScore from '../models/UserScore.js';
import User from '../models/User.js';
import UserQuizRecord from '../models/UserQuizRecord.js';
import UserQuestionRecord from '../models/UserQuestionRecord.js';
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
    let filter = {};
    
    // Only super admins can see hidden chapters
    if (!user || !user.isSuperAdmin) {
      filter.visible = { $ne: false }; // Show chapters where visible is true or undefined
    }
    
    const chapters = await Chapter.find(filter).sort('order');
    
    // Add question count for each chapter
    const chaptersWithCounts = await Promise.all(
      chapters.map(async (chapter) => {
        const questionCount = await Quiz.countDocuments({ chapter: chapter.name });
        return {
          ...chapter.toObject(),
          questionCount
        };
      })
    );
    
    res.json(chaptersWithCounts);
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

// Get questions by chapter (excluding already solved questions for authenticated users)
router.get('/questions', async (req, res) => {
  try {
    const { chapter } = req.query;
    if (!chapter) {
      return res.status(400).json({ error: 'Chapter parameter is required' });
    }
    
    let questions = await Quiz.find({ chapter });
    
    // If user is authenticated, exclude already solved questions
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        // Get already solved question IDs
        const solvedQuestions = await UserQuestionRecord.find({ userId, chapter }).select('questionId');
        const solvedQuestionIds = solvedQuestions.map(sq => sq.questionId.toString());
        
        // Filter out solved questions
        questions = questions.filter(q => !solvedQuestionIds.includes(q._id.toString()));
      } catch (tokenError) {
        // If token is invalid, return all questions
        console.log('Invalid token, returning all questions');
      }
    }
    
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
    
    // Check if chapter is in practice mode
    const chapterDoc = await Chapter.findOne({ name: chapter });
    const isChapterPracticeMode = chapterDoc?.practiceMode === true;
    
    // Get total questions in chapter and solved questions count
    const totalQuestionsInChapter = await Quiz.countDocuments({ chapter });
    const solvedQuestionsCount = await UserQuestionRecord.countDocuments({ userId, chapter });
    
    // Check if all questions in chapter are solved
    const allQuestionsSolved = solvedQuestionsCount >= totalQuestionsInChapter;
    
    // Practice mode if: chapter is marked as practice OR all questions are solved
    const practiceMode = isChapterPracticeMode || allQuestionsSolved;
    
    res.json({
      hasAttempted: false, // Always false since we track individual questions now
      practiceMode,
      totalQuestionsInChapter,
      solvedQuestionsCount,
      remainingQuestions: totalQuestionsInChapter - solvedQuestionsCount,
      allQuestionsSolved,
      previousAttempt: null
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

    console.log(`📝 Quiz submitted by ${user.username}: ${score}/${totalQuestions} in ${timeSpent}ms`);

    // Check if chapter is in practice mode
    const chapterDoc = await Chapter.findOne({ name: chapter });
    const isChapterPracticeMode = chapterDoc?.practiceMode === true;
    
    // Record individual question attempts
    const questionRecords = [];
    let newQuestionsCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[i];
      const isCorrect = (typeof question.correctAnswerIndex === 'number' && answer === question.correctAnswerIndex) ||
                       (typeof question.correctAnswer === 'string' && question.options[answer] === question.correctAnswer);
      
      try {
        const questionRecord = new UserQuestionRecord({
          userId,
          username: user.username,
          questionId: question._id,
          chapter,
          isCorrect,
          selectedAnswer: answer,
          timeSpent: Math.floor(timeSpent / totalQuestions)
        });
        
        await questionRecord.save();
        questionRecords.push(questionRecord);
        newQuestionsCount++;
      } catch (recordError) {
        if (recordError.code === 11000) {
          // Question already solved - this is practice mode
          console.log(`⚠️ Question ${question._id} already solved by ${user.username}`);
        } else {
          throw recordError;
        }
      }
    }
    
    // Check if this is practice mode
    const totalQuestionsInChapter = await Quiz.countDocuments({ chapter });
    const solvedQuestionsCount = await UserQuestionRecord.countDocuments({ userId, chapter });
    const allQuestionsSolved = solvedQuestionsCount >= totalQuestionsInChapter;
    
    const practiceMode = isChapterPracticeMode || newQuestionsCount === 0;
    
    if (practiceMode) {
      const reason = isChapterPracticeMode ? 'chapter is in practice mode' : 'all questions already solved';
      console.log(`🔄 Practice attempt by ${user.username} for chapter ${chapter} (${reason})`);
      
      return res.json({
        message: `Quiz completed in practice mode (${reason})`,
        practiceMode: true,
        isFirstAttempt: false,
        currentScore: score,
        leaderboardUpdated: false,
        badgesUpdated: false,
        solvedQuestionsCount,
        totalQuestionsInChapter,
        remainingQuestions: totalQuestionsInChapter - solvedQuestionsCount
      });
    }

    // This contains new questions - update stats
    console.log(`✅ ${newQuestionsCount} new questions solved by ${user.username} in chapter ${chapter}`);

    // Update or create leaderboard entry
    let userScore = await UserScore.findOne({ username: user.username, type: 'general' });
    let leaderboardUpdated = false;
    
    try {
      if (userScore) {
        userScore.score += score;
        await userScore.save();
        leaderboardUpdated = true;
        console.log(`📈 Updated leaderboard score for ${user.username}: +${score} (total: ${userScore.score})`);
      } else {
        userScore = new UserScore({
          userId,
          username: user.username,
          score: score,
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`,
          type: 'general'
        });
        await userScore.save();
        leaderboardUpdated = true;
        console.log(`🆕 Added ${user.username} to leaderboard: ${score}`);
      }
    } catch (scoreError) {
      console.error('Error updating leaderboard:', scoreError);
      // Continue without failing the entire request
    }

    // Update user stats and recalculate badges
    let userBadges = [];
    try {
      await badgeService.updateUserStats(userId, {
        score,
        totalQuestions,
        correctAnswers,
        timeSpent,
        isQuiz: true
      });
      userBadges = await badgeService.getUserBadges(userId);
    } catch (badgeError) {
      console.error('Error updating badges:', badgeError);
      // Continue without failing the entire request
    }

    res.json({ 
      message: 'Quiz submitted successfully',
      practiceMode: false,
      isFirstAttempt: true,
      currentScore: score,
      leaderboardUpdated,
      badgesUpdated: true,
      newScore: score,
      currentBadges: userBadges,
      solvedQuestionsCount,
      totalQuestionsInChapter,
      remainingQuestions: totalQuestionsInChapter - solvedQuestionsCount,
      allQuestionsSolved
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