import express from 'express';
import authMiddleware, { requireAdmin } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import UserScore from '../models/UserScore.js';
import Quiz from '../models/Quiz.js';
import Chapter from '../models/Chapter.js';
import UserStats from '../models/UserStats.js';
import Badge from '../models/Badge.js';
import UserQuizRecord from '../models/UserQuizRecord.js';
import BadgeService from '../services/badgeService.js';
import QuizConfig from '../models/QuizConfig.js';
import Subject from '../models/Subject.js';
import axios from 'axios';

const router = express.Router();

// List all users
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// List all subjects
router.get('/subjects', authMiddleware, requireAdmin, async (req, res) => {
  const subjects = await Subject.find().sort('order');
  res.json(subjects);
});

// Add a new subject
router.post('/subjects', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subject name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create subject' });
    }
  }
});

// Edit a subject
router.put('/subjects/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Subject name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update subject' });
    }
  }
});

// Delete a subject
router.delete('/subjects/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    // Also delete all chapters and questions in this subject
    const chapters = await Chapter.find({ subject: subject.name });
    for (const chapter of chapters) {
      await Quiz.deleteMany({ chapter: chapter.name });
    }
    await Chapter.deleteMany({ subject: subject.name });
    res.json({ message: 'Subject, its chapters and questions deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Reset a user's score and stats
router.post('/users/:id/reset-score', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`🔄 Resetting all data for user: ${user.username}`);
    
    // 1. Delete user's scores from leaderboard
    await UserScore.deleteMany({ user: userId });
    await UserScore.deleteMany({ username: user.username });
    console.log('✅ Deleted user scores');
    
    // 2. Delete user's stats (including badge statistics)
    await UserStats.deleteMany({ userId: userId });
    await UserStats.deleteMany({ username: user.username });
    console.log('✅ Deleted user stats');
    
    // 3. Delete user's quiz records
    await UserQuizRecord.deleteMany({ userId: userId });
    console.log('✅ Deleted user quiz records');
    
    // 4. Remove user from any badges they currently hold and recalculate
    const badgeService = new BadgeService();
    await badgeService.recalculateAllBadges();
    console.log('✅ Recalculated all badges');
    
    console.log(`🎉 Successfully reset all data for user: ${user.username}`);
    res.json({ message: `User ${user.username}'s scores, stats, and badges have been reset` });
    
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// Delete a user completely
router.delete('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow deleting admin users
    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    // Delete user's scores from leaderboard
    await UserScore.deleteMany({ username: user.username });
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    console.log(`Admin deleted user: ${user.email} (${user.username})`);
    res.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// List all chapters (all chapters visible in manage section)
router.get('/chapters', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const chapters = await Chapter.find().sort('order').populate('createdBy', 'username');
    
    // Add canEdit flag to indicate if current admin can edit this chapter
    const chaptersWithPermissions = chapters.map(chapter => ({
      ...chapter.toObject(),
      canEdit: !chapter.createdBy || chapter.createdBy._id.toString() === currentUserId
    }));
    
    res.json(chaptersWithPermissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Add a new chapter
router.post('/chapters', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const chapterData = {
      ...req.body,
      createdBy: req.user.userId,
      adminVisible: req.body.adminVisible !== undefined ? req.body.adminVisible : true
    };
    const chapter = new Chapter(chapterData);
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

// Edit a chapter (only if created by current admin)
router.put('/chapters/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Allow editing if chapter has no creator (legacy) or created by current admin
    if (chapter.createdBy && chapter.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit chapters you created' });
    }
    
    const updatedChapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedChapter);
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

// List all questions (filtered by chapter admin visibility)
router.get('/questions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    // Get all chapters that are either:
    // 1. Created by current admin, OR
    // 2. Marked as admin visible
    const visibleChapters = await Chapter.find({
      $or: [
        { createdBy: currentUserId },
        { adminVisible: true }
      ]
    });
    
    const chapterNames = visibleChapters.map(ch => ch.name);
    
    // Get questions from visible chapters
    const questions = await Quiz.find({
      chapter: { $in: chapterNames }
    }).populate('createdBy', 'username');
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Add a new question
router.post('/questions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const questionData = {
      ...req.body,
      createdBy: req.user.userId,
      adminVisible: req.body.adminVisible !== undefined ? req.body.adminVisible : true
    };
    const q = new Quiz(questionData);
    await q.save();
    res.status(201).json(q);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Edit a question (only if created by current admin)
router.put('/questions/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const question = await Quiz.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    if (question.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit questions you created' });
    }
    
    const q = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(q);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question (only if created by current admin)
router.delete('/questions/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const question = await Quiz.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    if (question.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete questions you created' });
    }
    
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Parse bulk questions using AI
router.post('/parse-bulk-questions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { bulkText } = req.body;
    
    if (!bulkText || !bulkText.trim()) {
      return res.status(400).json({ error: 'Bulk text is required' });
    }

    const systemPrompt = `You are an expert MCQ parser. Parse the given bulk MCQ text and extract structured data.

Rules:
1. Each question starts with a number (1., 2., etc.)
2. Options are labeled with Bengali letters (ক, খ, গ, ঘ) or English letters (A, B, C, D)
3. Explanation is usually the last line after options
4. Ignore lines like "See AI Explanation"
5. Return valid JSON array only

Output format:
[{
  "question": "question text",
  "options": {
    "ক": "option1",
    "খ": "option2",
    "গ": "option3",
    "ঘ": "option4"
  },
  "explanation": "explanation text"
}]`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'qwen/qwen-2.5-72b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this MCQ text:\n\n${bulkText}` }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message.content;
    
    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    
    const parsedQuestions = JSON.parse(jsonMatch[0]);
    
    res.json({ questions: parsedQuestions });
    
  } catch (error) {
    console.error('Error parsing bulk questions:', error);
    res.status(500).json({ error: 'Failed to parse questions' });
  }
});

// Get quiz configurations
router.get('/quiz-configs', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const configs = await QuizConfig.find();
    res.json(configs);
  } catch (error) {
    console.error('Error fetching quiz configs:', error);
    res.status(500).json({ error: 'Failed to fetch quiz configs' });
  }
});

// Update quiz configuration
router.put('/quiz-configs/:chapterId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { examQuestions, battleQuestions } = req.body;
    
    // Find the chapter to get its name
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Properly parse numbers, keeping the original value if it's already a valid number
    const examQuestionsNum = examQuestions !== undefined && examQuestions !== null && examQuestions !== '' 
      ? Math.max(0, parseInt(examQuestions)) 
      : 0;
    const battleQuestionsNum = battleQuestions !== undefined && battleQuestions !== null && battleQuestions !== '' 
      ? Math.max(0, parseInt(battleQuestions)) 
      : 0;
    
    const config = await QuizConfig.findOneAndUpdate(
      { chapterId },
      {
        chapterId,
        chapterName: chapter.name,
        examQuestions: examQuestionsNum,
        battleQuestions: battleQuestionsNum
      },
      { upsert: true, new: true }
    );
    
    res.json(config);
  } catch (error) {
    console.error('Error updating quiz config:', error);
    res.status(500).json({ error: 'Failed to update quiz config' });
  }
});

// Reset leaderboard (delete all scores, stats, badges, and quiz records)
router.post('/leaderboard/reset', authMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Starting complete leaderboard reset...');
    
    // 1. Delete all user scores from leaderboard
    await UserScore.deleteMany({});
    console.log('✅ Deleted all user scores');
    
    // 2. Delete all user stats (including badge statistics)
    await UserStats.deleteMany({});
    console.log('✅ Deleted all user stats');
    
    // 3. Reset all badges (clear current holders and history)
    await Badge.updateMany(
      {},
      {
        $unset: {
          currentHolderId: 1,
          currentHolderUsername: 1,
          currentValue: 1
        },
        $set: {
          previousHolders: [],
          lastUpdated: new Date()
        }
      }
    );
    console.log('✅ Reset all badge holders');
    
    // 4. Delete all quiz attempt records
    await UserQuizRecord.deleteMany({});
    console.log('✅ Deleted all quiz records');
    
    // 5. Delete all individual question records (makes users start from 0 solved questions)
    const UserQuestionRecord = (await import('../models/UserQuestionRecord.js')).default;
    await UserQuestionRecord.deleteMany({});
    console.log('✅ Deleted all question records - users reset to 0 solved questions');
    
    // 6. Re-initialize the badge system to ensure clean state
    const badgeService = new BadgeService();
    await badgeService.initializeBadges();
    console.log('✅ Re-initialized badge system');
    
    console.log('🎉 Complete leaderboard reset successful!');
    res.json({ 
      message: 'Complete leaderboard reset successful! All users reset to freshman status - they must solve all chapter questions again to unlock practice mode.' 
    });
    
  } catch (error) {
    console.error('❌ Error during leaderboard reset:', error);
    res.status(500).json({ 
      error: 'Failed to reset leaderboard completely',
      details: error.message 
    });
  }
});

export default router;