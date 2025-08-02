import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  badgeName: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'sharpest_mind',      // Most total correct answers
      'quiz_king',          // Highest average score (min 5 quizzes)
      'battle_champion',    // Most quiz battles won
      'speed_demon',        // Fastest average quiz time (min 5 quizzes)
      'leader_of_leaders'   // Ranked #1 in leaderboard
    ]
  },
  displayName: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  currentHolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentHolderUsername: {
    type: String,
    default: null
  },
  previousHolders: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    heldFrom: Date,
    heldUntil: Date,
    value: Number // The value they achieved to earn the badge
  }],
  currentValue: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
badgeSchema.index({ badgeName: 1 });
badgeSchema.index({ currentHolderId: 1 });

export default mongoose.model('Badge', badgeSchema);