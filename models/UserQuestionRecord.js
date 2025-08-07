import mongoose from 'mongoose';

const userQuestionRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  selectedAnswer: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true // in milliseconds
  },
  solvedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per user per question
userQuestionRecordSchema.index({ userId: 1, questionId: 1 }, { unique: true });

// Additional indexes for efficient queries
userQuestionRecordSchema.index({ userId: 1, chapter: 1 });
userQuestionRecordSchema.index({ chapter: 1, solvedAt: -1 });

export default mongoose.model('UserQuestionRecord', userQuestionRecordSchema);