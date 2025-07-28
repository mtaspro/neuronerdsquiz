import mongoose from 'mongoose';

const userScoreSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
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