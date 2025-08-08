import mongoose from 'mongoose';

const userScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true
  },
  avatar: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'battle'],
    default: 'general'
  }
}, {
  timestamps: true
});

// Remove unique constraint on userId to allow separate general/battle scores
userScoreSchema.index({ userId: 1, type: 1 }, { unique: true });

const UserScore = mongoose.model('UserScore', userScoreSchema);

export default UserScore;