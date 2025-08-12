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

// Request user deletion (creates request for SuperAdmin approval)
router.post('/users/:id/request-deletion', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required for deletion request' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isAdmin || user.isSuperAdmin) {
      return res.status(403).json({ error: 'Cannot request deletion of admin users' });
    }
    
    const AdminRequest = (await import('../models/AdminRequest.js')).default;
    const request = new AdminRequest({
      type: 'USER_DELETION',
      requestedBy: req.user.userId,
      requestedByUsername: req.user.email,
      targetUserId: userId,
      targetUsername: user.username,
      reason: reason.trim()
    });
    
    await request.save();
    res.json({ message: 'User deletion request submitted for SuperAdmin approval' });
    
  } catch (error) {
    console.error('Error creating deletion request:', error);
    res.status(500).json({ error: 'Failed to create deletion request' });
  }
});

// Request user score reset (creates request for SuperAdmin approval)
router.post('/users/:id/request-score-reset', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required for score reset request' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const AdminRequest = (await import('../models/AdminRequest.js')).default;
    const request = new AdminRequest({
      type: 'USER_SCORE_RESET',
      requestedBy: req.user.userId,
      requestedByUsername: req.user.email,
      targetUserId: userId,
      targetUsername: user.username,
      reason: reason.trim()
    });
    
    await request.save();
    res.json({ message: 'User score reset request submitted for SuperAdmin approval' });
    
  } catch (error) {
    console.error('Error creating score reset request:', error);
    res.status(500).json({ error: 'Failed to create score reset request' });
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
    // Drop unique index if it exists
    try {
      await Chapter.collection.dropIndex('name_1');
      console.log('Dropped unique index on chapter name');
    } catch (indexError) {
      // Index might not exist, ignore error
    }
    
    const chapterData = {
      ...req.body,
      createdBy: req.user.userId,
      adminVisible: req.body.adminVisible !== undefined ? req.body.adminVisible : true
    };
    const chapter = new Chapter(chapterData);
    await chapter.save();
    res.status(201).json(chapter);
  } catch (error) {
    console.error('Chapter creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create chapter' });
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
    console.error('Chapter update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update chapter' });
  }
});

// Delete a chapter (only if created by current admin)
router.delete('/chapters/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Allow deletion if chapter has no creator (legacy) or created by current admin
    if (chapter.createdBy && chapter.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete chapters you created' });
    }
    
    await Chapter.findByIdAndDelete(req.params.id);
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

// Add multiple questions in bulk
router.post('/questions/bulk', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }
    
    console.log('Adding', questions.length, 'questions in bulk');
    
    const questionsToAdd = questions.map(q => ({
      ...q,
      createdBy: req.user.userId,
      adminVisible: q.adminVisible !== undefined ? q.adminVisible : true
    }));
    
    const savedQuestions = await Quiz.insertMany(questionsToAdd);
    console.log('Successfully added', savedQuestions.length, 'questions');
    res.status(201).json(savedQuestions);
  } catch (error) {
    console.error('Bulk questions error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create questions in bulk' });
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

// Parse bulk questions using regex fallback
router.post('/parse-bulk-questions', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { bulkText } = req.body;
    
    if (!bulkText || !bulkText.trim()) {
      return res.status(400).json({ error: 'Bulk text is required' });
    }

    // Simple regex-based parser for Chorcha format
    const questions = [];
    const questionBlocks = bulkText.split(/\n\s*---\s*\n/).filter(block => block.trim());
    
    for (const block of questionBlocks) {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      let question = '';
      const options = [];
      let correctAnswer = '';
      let explanation = '';
      
      let currentSection = 'question';
      
      for (const line of lines) {
        if (line.match(/^[কখগঘA-D]\./)) {
          currentSection = 'options';
          options.push(line.substring(2).trim());
        } else if (line.startsWith('Correct Answer:')) {
          correctAnswer = line.replace('Correct Answer:', '').trim();
          currentSection = 'answer';
        } else if (line.startsWith('Explanation:')) {
          explanation = line.replace('Explanation:', '').trim();
          currentSection = 'explanation';
        } else if (currentSection === 'question') {
          question += (question ? ' ' : '') + line;
        } else if (currentSection === 'explanation') {
          explanation += (explanation ? ' ' : '') + line;
        }
      }
      
      if (question && options.length >= 2) {
        questions.push({
          question: question,
          options: options,
          correctAnswer: correctAnswer,
          explanation: explanation
        });
      }
    }
    
    console.log('Parsed', questions.length, 'questions using regex parser');
    res.json({ questions });
    
  } catch (error) {
    console.error('Error parsing bulk questions:', error.message);
    res.status(500).json({ error: error.message || 'Failed to parse questions' });
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

// Request leaderboard reset (creates request for SuperAdmin approval)
router.post('/leaderboard/request-reset', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required for reset request' });
    }
    
    const AdminRequest = (await import('../models/AdminRequest.js')).default;
    const request = new AdminRequest({
      type: 'LEADERBOARD_RESET',
      requestedBy: req.user.userId,
      requestedByUsername: req.user.email,
      reason: reason.trim()
    });
    
    await request.save();
    res.json({ message: 'Leaderboard reset request submitted for SuperAdmin approval' });
    
  } catch (error) {
    console.error('Error creating reset request:', error);
    res.status(500).json({ error: 'Failed to create reset request' });
  }
});

export default router;