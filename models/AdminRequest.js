import mongoose from 'mongoose';

const adminRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['USER_DELETION', 'USER_SCORE_RESET', 'LEADERBOARD_RESET', 'QUIZ_LEADERBOARD_RESET', 'BATTLE_LEADERBOARD_RESET'],
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedByUsername: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  // For user deletion requests
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetUsername: {
    type: String
  },
  reason: {
    type: String,
    required: true
  },
  // SuperAdmin response
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('AdminRequest', adminRequestSchema);