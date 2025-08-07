import mongoose from 'mongoose';

const userScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
  }
}, {
  timestamps: true
});

const UserScore = mongoose.model('UserScore', userScoreSchema);

export default UserScore;