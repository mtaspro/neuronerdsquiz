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

  // Gamification & Economy (HSC Aura)
  auraPoints: {
    type: Number,
    default: 0
  },
  inGameTokens: {
    type: Number,
    default: 0
  },

  // Scholarship Vault (Milestone Scholarship Rewards)
  scholarshipVault: {
    lockedAmount: {
      type: Number,
      default: 0
    },
    claimableAmount: {
      type: Number,
      default: 0
    },
    claimedTotal: {
      type: Number,
      default: 0
    },
    milestonesCompleted: {
      type: [String],
      default: []
    } // e.g. ['hsc_1st_paper_all']
  },

  // Cosmetic Inventory (Roblox-style Cosmetics & Lifelines)
  inventory: {
    nameplates: {
      type: [String],
      default: ['default']
    },
    frames: {
      type: [String],
      default: ['default']
    },
    titles: {
      type: [String],
      default: ['Novice Adventurer']
    },
    lifelines: {
      timeFreeze: {
        type: Number,
        default: 2
      },
      hintScroll: {
        type: Number,
        default: 2
      },
      fiftyFifty: {
        type: Number,
        default: 2
      }
    }
  },

  // Currently Equipped Cosmetics
  equipped: {
    nameplate: {
      type: String,
      default: 'default'
    },
    frame: {
      type: String,
      default: 'default'
    },
    title: {
      type: String,
      default: 'Novice Adventurer'
    }
  },

  // Campaign Progress (Gamified Story Mode)
  campaignProgress: [{
    chapterId: {
      type: String,
      required: true
    },
    completedLevels: {
      type: [Number],
      default: []
    },
    stars: {
      type: Map,
      of: Number,
      default: {}
    }
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

const UserStats = mongoose.model('UserStats', userStatsSchema);

export default UserStats;