import express from 'express';
import { sessionMiddleware, requireSuperAdmin } from '../middleware/sessionMiddleware.js';
import AdminRequest from '../models/AdminRequest.js';
import User from '../models/User.js';
import UserScore from '../models/UserScore.js';
import UserStats from '../models/UserStats.js';
import Badge from '../models/Badge.js';
import UserQuizRecord from '../models/UserQuizRecord.js';
import UserQuestionRecord from '../models/UserQuestionRecord.js';
import BadgeService from '../services/badgeService.js';
import GlobalSettings from '../models/GlobalSettings.js';
import LifelineConfig from '../models/LifelineConfig.js';

const router = express.Router();

// Get current showdown event status (public endpoint)
router.get('/showdown-event', async (req, res) => {
  try {
    const eventSettings = await GlobalSettings.findOne({ settingKey: 'showdownEvent' });
    
    if (!eventSettings || !eventSettings.settingValue.isActive) {
      return res.json({ isActive: false });
    }
    
    res.json(eventSettings.settingValue);
  } catch (error) {
    console.error('Error fetching event status:', error);
    res.status(500).json({ error: 'Failed to fetch event status' });
  }
});

// Get all pending requests
router.get('/requests', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const requests = await AdminRequest.find({ status: 'PENDING' })
      .populate('requestedBy', 'username email')
      .populate('targetUserId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Get all requests (with history)
router.get('/requests/all', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const requests = await AdminRequest.find()
      .populate('requestedBy', 'username email')
      .populate('targetUserId', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Approve/Reject request
router.post('/requests/:id/review', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'APPROVE' or 'REJECT'
    
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    const request = await AdminRequest.findById(id).populate('targetUserId');
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request already reviewed' });
    }
    
    // Update request status
    request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    request.reviewedBy = req.user.userId;
    request.reviewedAt = new Date();
    request.reviewNotes = notes || '';
    await request.save();
    
    let message = `Request ${action.toLowerCase()}d successfully`;
    
    // Execute the action if approved
    if (action === 'APPROVE') {
      if (request.type === 'USER_DELETION') {
        await executeUserDeletion(request.targetUserId);
        message = `User ${request.targetUsername} deleted successfully`;
      } else if (request.type === 'USER_SCORE_RESET') {
        await executeUserScoreReset(request.targetUserId);
        message = `User ${request.targetUsername} score reset successfully`;
      } else if (request.type === 'LEADERBOARD_RESET') {
        await executeLeaderboardReset();
        message = 'Full leaderboard reset completed successfully';
      } else if (request.type === 'QUIZ_LEADERBOARD_RESET') {
        await executeQuizLeaderboardReset();
        message = 'Quiz leaderboard reset completed successfully';
      } else if (request.type === 'BATTLE_LEADERBOARD_RESET') {
        await executeBattleLeaderboardReset();
        message = 'Battle leaderboard reset completed successfully';
      }
    }
    
    res.json({ message });
    
  } catch (error) {
    console.error('Error reviewing request:', error);
    res.status(500).json({ error: 'Failed to review request' });
  }
});

// Execute user deletion
async function executeUserDeletion(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  
  // Delete user's scores from leaderboard
  await UserScore.deleteMany({ username: user.username });
  
  // Delete user's stats (for deletion, we actually delete)
  await UserStats.deleteMany({ userId: userId });
  await UserStats.deleteMany({ username: user.username });
  
  // Delete user's quiz records
  await UserQuizRecord.deleteMany({ userId: userId });
  
  // Delete user's question records
  await UserQuestionRecord.deleteMany({ userId: userId });
  
  // Delete the user
  await User.findByIdAndDelete(userId);
  
  console.log(`SuperAdmin approved deletion of user: ${user.email} (${user.username})`);
}

// Execute leaderboard reset
async function executeLeaderboardReset() {
  console.log('🔄 Starting SuperAdmin approved leaderboard reset...');
  
  // Delete ALL user scores (both general and battle)
  await UserScore.deleteMany({});
  console.log('✅ Deleted all user scores (general + battle)');
  
  // Reset all user stats instead of deleting
  await UserStats.updateMany(
    {},
    {
      $set: {
        totalQuizzes: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        totalScore: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        averageTimePerQuiz: 0,
        fastestQuizTime: null,
        totalBattles: 0,
        battlesWon: 0,
        battlesLost: 0,
        battleWinRate: 0,
        currentBadges: [],
        badgeHistory: [],
        lastUpdated: new Date()
      }
    }
  );
  console.log('✅ Reset all user stats to zero');
  
  // Reset ALL user fields to zero and clear badges
  await User.updateMany(
    {},
    {
      $set: {
        totalScore: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuizzes: 0,
        streak: 0,
        lastQuizDate: null,
        battleWins: 0,
        battleLosses: 0,
        battleDraws: 0,
        totalBattles: 0,
        battleScore: 0,
        badges: []
      }
    }
  );
  console.log('✅ Reset all user stats to zero');
  
  // Reset ALL badges
  await Badge.updateMany(
    {},
    {
      $set: {
        currentHolderId: null,
        currentHolderUsername: null,
        currentValue: 0,
        previousHolders: [],
        lastUpdated: new Date()
      }
    }
  );
  console.log('✅ Reset all badge holders');
  
  // Delete all quiz attempt records
  await UserQuizRecord.deleteMany({});
  console.log('✅ Deleted all quiz records');
  
  // Delete all individual question records
  await UserQuestionRecord.deleteMany({});
  console.log('✅ Deleted all question records');
  
  // Re-initialize the badge system
  const badgeService = new BadgeService();
  await badgeService.initializeBadges();
  console.log('✅ Re-initialized badge system');
  
  // Recalculate all badges
  await badgeService.recalculateAllBadges();
  console.log('✅ Recalculated all badges');
  
  console.log('🎉 Complete reset: Both leaderboards cleared, all stats reset, badges reset!');
}

// Execute quiz leaderboard reset only
async function executeQuizLeaderboardReset() {
  console.log('🔄 Starting quiz leaderboard reset...');
  
  // Delete ALL non-battle scores (general and legacy scores)
  await UserScore.deleteMany({ $or: [{ type: 'general' }, { type: { $exists: false } }, { type: null }] });
  console.log('✅ Deleted quiz leaderboard scores');
  
  // Reset ALL quiz-related user fields and badges
  await User.updateMany(
    {},
    {
      $set: {
        totalScore: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuizzes: 0,
        streak: 0,
        currentStreak: 0,
        lastQuizDate: null,
        badges: []
      }
    }
  );
  console.log('✅ Reset quiz-related user stats');
  
  // Delete ALL quiz records
  const UserQuizRecord = (await import('../models/UserQuizRecord.js')).default;
  await UserQuizRecord.deleteMany({});
  console.log('✅ Deleted all quiz records');
  
  // Reset quiz stats in UserStats but keep battle stats
  await UserStats.updateMany(
    {},
    {
      $set: {
        totalQuizzes: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        totalScore: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        averageTimePerQuiz: 0,
        fastestQuizTime: null,
        currentBadges: [],
        badgeHistory: [],
        lastUpdated: new Date()
      }
    }
  );
  console.log('✅ Reset quiz UserStats');
  
  // Reset quiz-related badges (sharpest_mind, quiz_king, speed_demon, leader_of_leaders)
  await Badge.updateMany(
    { badgeName: { $in: ['sharpest_mind', 'quiz_king', 'speed_demon', 'leader_of_leaders'] } },
    {
      $set: {
        currentHolderId: null,
        currentHolderUsername: null,
        currentValue: 0,
        previousHolders: [],
        lastUpdated: new Date()
      }
    }
  );
  console.log('✅ Reset quiz-related badges');
  
  // Recalculate all badges
  const badgeService = new BadgeService();
  await badgeService.recalculateAllBadges();
  console.log('✅ Recalculated all badges');
  
  console.log('🎉 Quiz leaderboard reset completed!');
}

// Execute battle leaderboard reset only
async function executeBattleLeaderboardReset() {
  console.log('🔄 Starting battle leaderboard reset...');
  
  // Delete ALL battle scores
  await UserScore.deleteMany({ type: 'battle' });
  console.log('✅ Deleted battle leaderboard scores');
  
  // Reset ALL battle-related user fields and badges
  await User.updateMany(
    {},
    {
      $set: {
        battleWins: 0,
        battleLosses: 0,
        battleDraws: 0,
        totalBattles: 0,
        battleScore: 0,
        badges: []
      }
    }
  );
  console.log('✅ Reset battle-related user stats');
  
  // Reset battle stats in UserStats
  await UserStats.updateMany(
    {},
    {
      $set: {
        totalBattles: 0,
        battlesWon: 0,
        battlesLost: 0,
        battleWinRate: 0,
        currentBadges: [],
        badgeHistory: [],
        lastUpdated: new Date()
      }
    }
  );
  console.log('✅ Reset battle UserStats');
  
  // Reset battle-related badges (battle_champion)
  await Badge.updateMany(
    { badgeName: { $in: ['battle_champion'] } },
    {
      $set: {
        currentHolderId: null,
        currentHolderUsername: null,
        currentValue: 0,
        previousHolders: [],
        lastUpdated: new Date()
      }
    }
  );
  console.log('✅ Reset battle-related badges');
  
  // Recalculate all badges
  const badgeService = new BadgeService();
  await badgeService.recalculateAllBadges();
  console.log('✅ Recalculated all badges');
  
  console.log('🎉 Battle leaderboard reset completed!');
}

// Execute user score reset
async function executeUserScoreReset(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  
  // Delete user's scores from leaderboard
  await UserScore.deleteMany({ userId: userId });
  await UserScore.deleteMany({ username: user.username });
  
  // Reset user's stats instead of deleting
  await UserStats.updateMany(
    { $or: [{ userId: userId }, { username: user.username }] },
    {
      $set: {
        totalQuizzes: 0,
        totalCorrectAnswers: 0,
        totalQuestions: 0,
        totalScore: 0,
        averageScore: 0,
        totalTimeSpent: 0,
        averageTimePerQuiz: 0,
        fastestQuizTime: null,
        totalBattles: 0,
        battlesWon: 0,
        battlesLost: 0,
        battleWinRate: 0,
        currentBadges: [],
        badgeHistory: [],
        lastUpdated: new Date()
      }
    }
  );
  
  // Reset user fields and clear badges
  await User.findByIdAndUpdate(userId, {
    $set: {
      totalScore: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuizzes: 0,
      streak: 0,
      currentStreak: 0,
      lastQuizDate: null,
      battleWins: 0,
      battleLosses: 0,
      battleDraws: 0,
      totalBattles: 0,
      battleScore: 0,
      badges: []
    }
  });
  
  // Recalculate all badges
  const badgeService = new BadgeService();
  await badgeService.recalculateAllBadges();
  
  console.log(`✅ Reset all data for user: ${user.username}`);
}

// Set global default theme
router.post('/set-global-theme', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { theme } = req.body;
    
    await GlobalSettings.findOneAndUpdate(
      { settingKey: 'defaultTheme' },
      { 
        settingValue: theme,
        updatedBy: req.user.userId,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: `Global theme set to ${theme}` });
  } catch (error) {
    console.error('Error setting global theme:', error);
    res.status(500).json({ error: 'Failed to set global theme' });
  }
});

// Get global settings
router.get('/global-settings', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const settings = await GlobalSettings.find().populate('updatedBy', 'username');
    res.json(settings);
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Start Neuronerds Showdown event
router.post('/start-showdown-event', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { endTime } = req.body;
    
    if (!endTime) {
      return res.status(400).json({ error: 'End time is required' });
    }
    
    const endDateTime = new Date(endTime);
    if (endDateTime <= new Date()) {
      return res.status(400).json({ error: 'End time must be in the future' });
    }
    
    await GlobalSettings.findOneAndUpdate(
      { settingKey: 'showdownEvent' },
      { 
        settingValue: {
          isActive: true,
          startTime: new Date(),
          endTime: endDateTime,
          title: 'The Neuronerds Showdown'
        },
        updatedBy: req.user.userId,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: 'Neuronerds Showdown event started!' });
  } catch (error) {
    console.error('Error starting event:', error);
    res.status(500).json({ error: 'Failed to start event' });
  }
});

// End Neuronerds Showdown event
router.post('/end-showdown-event', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    await GlobalSettings.findOneAndUpdate(
      { settingKey: 'showdownEvent' },
      { 
        settingValue: {
          isActive: false,
          endTime: new Date()
        },
        updatedBy: req.user.userId,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: 'Neuronerds Showdown event ended!' });
  } catch (error) {
    console.error('Error ending event:', error);
    res.status(500).json({ error: 'Failed to end event' });
  }
});

// Get lifeline configuration
router.get('/lifeline-config', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    let config = await LifelineConfig.findOne();
    if (!config) {
      config = new LifelineConfig();
      await config.save();
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update lifeline configuration
router.put('/lifeline-config', sessionMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    let config = await LifelineConfig.findOne();
    if (!config) {
      config = new LifelineConfig();
    }
    Object.assign(config, req.body);
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;