import express from 'express';
import authMiddleware, { requireSuperAdmin } from '../middleware/authMiddleware.js';
import AdminRequest from '../models/AdminRequest.js';
import User from '../models/User.js';
import UserScore from '../models/UserScore.js';
import UserStats from '../models/UserStats.js';
import Badge from '../models/Badge.js';
import UserQuizRecord from '../models/UserQuizRecord.js';
import UserQuestionRecord from '../models/UserQuestionRecord.js';
import BadgeService from '../services/badgeService.js';

const router = express.Router();

// Get all pending requests
router.get('/requests', authMiddleware, requireSuperAdmin, async (req, res) => {
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
router.get('/requests/all', authMiddleware, requireSuperAdmin, async (req, res) => {
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
router.post('/requests/:id/review', authMiddleware, requireSuperAdmin, async (req, res) => {
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
      } else if (request.type === 'LEADERBOARD_RESET') {
        await executeLeaderboardReset();
        message = 'Leaderboard reset completed successfully';
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
  
  // Delete user's stats
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
  
  // Delete all user scores from leaderboard
  await UserScore.deleteMany({});
  console.log('✅ Deleted all user scores');
  
  // Delete all user stats
  await UserStats.deleteMany({});
  console.log('✅ Deleted all user stats');
  
  // Reset all badges
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
  
  // Delete all quiz attempt records
  await UserQuizRecord.deleteMany({});
  console.log('✅ Deleted all quiz records');
  
  // Delete all individual question records
  await UserQuestionRecord.deleteMany({});
  console.log('✅ Deleted all question records - users reset to 0 solved questions');
  
  // Re-initialize the badge system
  const badgeService = new BadgeService();
  await badgeService.initializeBadges();
  console.log('✅ Re-initialized badge system');
  
  console.log('🎉 SuperAdmin approved leaderboard reset completed!');
}

export default router;