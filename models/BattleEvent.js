import mongoose from 'mongoose';

const battleEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  prizeAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winnerUsername: {
    type: String
  },
  winnerScore: {
    type: Number
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    totalScore: Number,
    battlesPlayed: Number
  }]
}, {
  timestamps: true
});

export default mongoose.model('BattleEvent', battleEventSchema);