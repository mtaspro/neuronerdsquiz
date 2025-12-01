import express from 'express';
import { sessionMiddleware, requireAdmin } from '../middleware/sessionMiddleware.js';
import { cacheMiddleware, clearCache } from '../middleware/cacheMiddleware.js';
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
import BattleReminder from '../models/BattleReminder.js';
import axios from 'axios';

const router = express.Router();

// List all users with caching
router.get('/users', sessionMiddleware, requireAdmin, cacheMiddleware('short'), async (req, res) => {
  const users = await User.find({}, '-password').select('+phoneNumber +whatsappNotifications +blockedFromBot').limit(100).lean();
  res.json(users);
});

// Block/Unblock user from WhatsApp bot
router.put('/users/:id/block-bot', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { blocked } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { blockedFromBot: blocked },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: `User ${blocked ? 'blocked from' : 'unblocked from'} WhatsApp bot`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user bot access' });
  }
});

// Check if user is blocked from bot
router.get('/check-blocked/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const user = await User.findOne({ phoneNumber: { $regex: phone, $options: 'i' } });
    res.json({ blocked: user?.blockedFromBot || false });
  } catch (error) {
    res.json({ blocked: false });
  }
});

// Block phone number from WhatsApp bot
router.post('/block-phone', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Format phone number
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('01')) {
      phoneNumber = '880' + phoneNumber.substring(1);
    }
    
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this phone number' });
    }
    
    if (user.blockedFromBot) {
      return res.json({ message: 'User is already blocked from WhatsApp bot' });
    }
    
    user.blockedFromBot = true;
    await user.save();
    
    res.json({ message: `${user.username} (${phoneNumber}) blocked from WhatsApp bot` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block phone number' });
  }
});

// Unblock phone number from WhatsApp bot
router.post('/unblock-phone', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    let { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Format phone number
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('01')) {
      phoneNumber = '880' + phoneNumber.substring(1);
    }
    
    const user = await User.findOne({ phoneNumber });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found with this phone number' });
    }
    
    if (!user.blockedFromBot) {
      return res.json({ message: 'User is not blocked from WhatsApp bot' });
    }
    
    user.blockedFromBot = false;
    await user.save();
    
    res.json({ message: `${user.username} (${phoneNumber}) unblocked from WhatsApp bot` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock phone number' });
  }
});

// Update user WhatsApp info (admin only)
router.put('/users/:id/whatsapp', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { phoneNumber, whatsappNotifications } = req.body;
    
    // Format phone number for Bangladesh
    let formattedPhone = phoneNumber || '';
    if (formattedPhone && formattedPhone.startsWith('01')) {
      formattedPhone = '880' + formattedPhone.substring(1); // Remove + for WhatsApp compatibility
    } else if (formattedPhone && formattedPhone.startsWith('+880')) {
      formattedPhone = formattedPhone.substring(1); // Remove + if present
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        phoneNumber: formattedPhone,
        whatsappNotifications: whatsappNotifications === true || whatsappNotifications === 'true'
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User WhatsApp info updated', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user WhatsApp info' });
  }
});

// List all subjects with caching
router.get('/subjects', sessionMiddleware, requireAdmin, cacheMiddleware('medium'), async (req, res) => {
  const subjects = await Subject.find().sort('order').lean();
  res.json(subjects);
});

// Add a new subject
router.post('/subjects', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    clearCache('subjects');
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
router.put('/subjects/:id', sessionMiddleware, requireAdmin, async (req, res) => {
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
router.delete('/subjects/:id', sessionMiddleware, requireAdmin, async (req, res) => {
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
router.post('/users/:id/reset-score', sessionMiddleware, requireAdmin, async (req, res) => {
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
router.post('/users/:id/request-deletion', sessionMiddleware, requireAdmin, async (req, res) => {
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
router.post('/users/:id/request-score-reset', sessionMiddleware, requireAdmin, async (req, res) => {
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

// List all chapters with caching
router.get('/chapters', sessionMiddleware, requireAdmin, cacheMiddleware('medium'), async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const chapters = await Chapter.find().sort('order').populate('createdBy', 'username').lean();
    
    const chaptersWithPermissions = chapters.map(chapter => ({
      ...chapter,
      canEdit: !chapter.createdBy || chapter.createdBy._id.toString() === currentUserId
    }));
    
    res.json(chaptersWithPermissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Add a new chapter
router.post('/chapters', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const chapterData = {
      ...req.body,
      createdBy: req.user.userId,
      adminVisible: req.body.adminVisible !== undefined ? req.body.adminVisible : true
    };
    const chapter = new Chapter(chapterData);
    await chapter.save();
    clearCache('chapters');
    res.status(201).json(chapter);
  } catch (error) {
    console.error('Chapter creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create chapter' });
  }
});

// Edit a chapter (SuperAdmin can edit all, Admin can edit only their own)
router.put('/chapters/:id', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Check permissions: SuperAdmin can edit all, Admin can edit only their own
    const user = await User.findById(req.user.userId);
    if (!user.isSuperAdmin && chapter.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only edit chapters you created' });
    }
    
    const updatedChapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedChapter);
  } catch (error) {
    console.error('Chapter update error:', error);
    res.status(500).json({ error: error.message || 'Failed to update chapter' });
  }
});

// Delete a chapter (SuperAdmin can delete all, Admin can delete only their own)
router.delete('/chapters/:id', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    console.log(`Attempting to delete chapter with ID: ${req.params.id}`);
    
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      console.log(`Chapter not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: `Chapter not found with ID: ${req.params.id}` });
    }
    
    console.log(`Found chapter: ${chapter.name}, created by: ${chapter.createdBy}`);
    
    // Check permissions: SuperAdmin can delete all, Admin can delete only their own
    const user = await User.findById(req.user.userId);
    console.log(`User ${user.username} is SuperAdmin: ${user.isSuperAdmin}`);
    
    if (!user.isSuperAdmin && chapter.createdBy && chapter.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete chapters you created' });
    }
    
    await Chapter.findByIdAndDelete(req.params.id);
    // Also delete all questions in this chapter
    const deletedQuestions = await Quiz.deleteMany({ chapter: chapter.name });
    console.log(`Deleted chapter ${chapter.name} and ${deletedQuestions.deletedCount} questions`);
    
    res.json({ message: `Chapter '${chapter.name}' and ${deletedQuestions.deletedCount} questions deleted` });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({ error: `Failed to delete chapter: ${error.message}` });
  }
});

// List all questions (filtered by chapter admin visibility)
router.get('/questions', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { page = 1, limit = 100, chapter } = req.query;
    
    // Get all chapters that are either:
    // 1. Created by current admin, OR
    // 2. Marked as admin visible
    const visibleChapters = await Chapter.find({
      $or: [
        { createdBy: currentUserId },
        { adminVisible: true }
      ]
    }).select('name');
    
    const chapterNames = visibleChapters.map(ch => ch.name);
    
    // Build query
    let query = { chapter: { $in: chapterNames } };
    if (chapter) {
      query.chapter = chapter;
    }
    
    // Get questions from visible chapters with pagination
    const questions = await Quiz.find(query)
      .populate('createdBy', 'username')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Add a new question
router.post('/questions', sessionMiddleware, requireAdmin, async (req, res) => {
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
router.post('/questions/bulk', sessionMiddleware, requireAdmin, async (req, res) => {
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

// Edit a question (SuperAdmin can edit all, Admin can edit only their own)
router.put('/questions/:id', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const question = await Quiz.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check permissions: SuperAdmin can edit all, Admin can edit only their own
    const user = await User.findById(currentUserId);
    if (!user.isSuperAdmin && question.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only edit questions you created' });
    }
    
    const q = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(q);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete a question (SuperAdmin can delete all, Admin can delete only their own)
router.delete('/questions/:id', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const question = await Quiz.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check permissions: SuperAdmin can delete all, Admin can delete only their own
    const user = await User.findById(currentUserId);
    if (!user.isSuperAdmin && question.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete questions you created' });
    }
    
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Parse bulk questions using regex fallback
router.post('/parse-bulk-questions', sessionMiddleware, requireAdmin, async (req, res) => {
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
router.get('/quiz-configs', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const configs = await QuizConfig.find();
    res.json(configs);
  } catch (error) {
    console.error('Error fetching quiz configs:', error);
    res.status(500).json({ error: 'Failed to fetch quiz configs' });
  }
});

// Get question counts with caching
router.get('/question-counts', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const questionCounts = await Quiz.aggregate([
      {
        $group: {
          _id: '$chapter',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const countsObject = {};
    questionCounts.forEach(item => {
      if (item._id) {
        countsObject[item._id] = item.count;
      }
    });
    
    res.json(countsObject);
  } catch (error) {
    console.error('Error fetching question counts:', error);
    res.status(500).json({ error: 'Failed to fetch question counts' });
  }
});

// Get quiz config by chapter name (public endpoint for battle system)
router.get('/quiz-config/:chapterName', async (req, res) => {
  try {
    const { chapterName } = req.params;
    const chapter = await Chapter.findOne({ name: chapterName });
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    const config = await QuizConfig.findOne({ chapterId: chapter._id });
    
    if (!config) {
      // Return default config if none exists
      return res.json({
        chapterName,
        examQuestions: 10,
        battleQuestions: 10,
        negativeScoring: false,
        negativeScore: -1
      });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching quiz config:', error);
    res.status(500).json({ error: 'Failed to fetch quiz config' });
  }
});

// Update quiz configuration
router.put('/quiz-configs/:chapterId', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { examQuestions, battleQuestions, negativeScoring, negativeScore } = req.body;
    
    // Find the chapter to get its name
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Properly parse numbers
    const examQuestionsNum = examQuestions !== undefined && examQuestions !== null && examQuestions !== '' 
      ? Math.max(0, parseInt(examQuestions)) 
      : 0;
    const battleQuestionsNum = battleQuestions !== undefined && battleQuestions !== null && battleQuestions !== '' 
      ? Math.max(0, parseInt(battleQuestions)) 
      : 0;
    const negativeScoreNum = negativeScore !== undefined && negativeScore !== null && negativeScore !== ''
      ? Math.min(0, parseFloat(negativeScore))
      : -1;
    
    const config = await QuizConfig.findOneAndUpdate(
      { chapterId },
      {
        chapterId,
        chapterName: chapter.name,
        examQuestions: examQuestionsNum,
        battleQuestions: battleQuestionsNum,
        negativeScoring: negativeScoring === true || negativeScoring === 'true',
        negativeScore: negativeScoreNum
      },
      { upsert: true, new: true }
    );
    
    res.json(config);
  } catch (error) {
    console.error('Error updating quiz config:', error);
    res.status(500).json({ error: 'Failed to update quiz config' });
  }
});

// Request quiz leaderboard reset (creates request for SuperAdmin approval)
router.post('/leaderboard/request-quiz-reset', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required for quiz reset request' });
    }
    
    const AdminRequest = (await import('../models/AdminRequest.js')).default;
    const request = new AdminRequest({
      type: 'QUIZ_LEADERBOARD_RESET',
      requestedBy: req.user.userId,
      requestedByUsername: req.user.email,
      reason: reason.trim()
    });
    
    await request.save();
    res.json({ message: 'Quiz leaderboard reset request submitted for SuperAdmin approval' });
    
  } catch (error) {
    console.error('Error creating quiz reset request:', error);
    res.status(500).json({ error: 'Failed to create quiz reset request' });
  }
});

// Request battle leaderboard reset (creates request for SuperAdmin approval)
router.post('/leaderboard/request-battle-reset', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason is required for battle reset request' });
    }
    
    const AdminRequest = (await import('../models/AdminRequest.js')).default;
    const request = new AdminRequest({
      type: 'BATTLE_LEADERBOARD_RESET',
      requestedBy: req.user.userId,
      requestedByUsername: req.user.email,
      reason: reason.trim()
    });
    
    await request.save();
    res.json({ message: 'Battle leaderboard reset request submitted for SuperAdmin approval' });
    
  } catch (error) {
    console.error('Error creating battle reset request:', error);
    res.status(500).json({ error: 'Failed to create battle reset request' });
  }
});

// Request full leaderboard reset (creates request for SuperAdmin approval) - Legacy endpoint
router.post('/leaderboard/request-reset', sessionMiddleware, requireAdmin, async (req, res) => {
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
    res.json({ message: 'Full leaderboard reset request submitted for SuperAdmin approval' });
    
  } catch (error) {
    console.error('Error creating reset request:', error);
    res.status(500).json({ error: 'Failed to create reset request' });
  }
});



// Battle reminder management (SuperAdmin only)
router.get('/battle-reminders', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const reminders = await BattleReminder.find()
      .populate('createdBy', 'username')
      .sort({ date: 1 })
      .limit(30);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch battle reminders' });
  }
});

router.post('/battle-reminders', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { date, topics } = req.body;
    
    if (!date || !topics) {
      return res.status(400).json({ error: 'Date and topics are required' });
    }
    
    const reminder = new BattleReminder({
      date: new Date(date),
      topics: topics.trim(),
      createdBy: req.user.userId
    });
    
    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Reminder already exists for this date' });
    } else {
      res.status(500).json({ error: 'Failed to create battle reminder' });
    }
  }
});

router.put('/battle-reminders/:id', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const { topics, isActive } = req.body;
    
    const reminder = await BattleReminder.findByIdAndUpdate(
      req.params.id,
      { topics: topics?.trim(), isActive },
      { new: true }
    );
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update battle reminder' });
  }
});

router.delete('/battle-reminders/:id', sessionMiddleware, requireAdmin, async (req, res) => {
  try {
    const reminder = await BattleReminder.findByIdAndDelete(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Battle reminder deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete battle reminder' });
  }
});

export default router;