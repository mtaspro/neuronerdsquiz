import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  
  // Quiz Statistics
  totalQuizzes: {
    type: Number,
    default: 0
  },
  totalCorrectAnswers: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  
  // Time Statistics
  totalTimeSpent: {
    type: Number,
    default: 0 // in milliseconds
  },
  averageTimePerQuiz: {
    type: Number,
    default: 0 // in milliseconds
  },
  fastestQuizTime: {
    type: Number,
    default: null // in milliseconds
  },
  
  // Battle Statistics
  totalBattles: {
    type: Number,
    default: 0
  },
  battlesWon: {
    type: Number,
    default: 0
  },
  battlesLost: {
    type: Number,
    default: 0
  },
  battleWinRate: {
    type: Number,
    default: 0
  },
  
  // Current Badges
  currentBadges: [{
    badgeName: String,
    displayName: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Badge History
  badgeHistory: [{
    badgeName: String,
    displayName: String,
    action: {
      type: String,
      enum: ['earned', 'lost']
    },
    value: Number,
    timestamp: {
      type: Date,
      default: Date.now
    },
    lostTo: String // username who took the badge
  }],
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userStatsSchema.index({ userId: 1 });
userStatsSchema.index({ username: 1 });
userStatsSchema.index({ totalCorrectAnswers: -1 });
userStatsSchema.index({ averageScore: -1 });
userStatsSchema.index({ battlesWon: -1 });
userStatsSchema.index({ averageTimePerQuiz: 1 });

export default mongoose.model('UserStats', userStatsSchema);