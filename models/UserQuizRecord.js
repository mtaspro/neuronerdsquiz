import mongoose from 'mongoose';

const userQuizRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  quizId: {
    type: String,
    required: true // This will be a combination of chapter + question set identifier
  },
  chapter: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number,
    required: true // in milliseconds
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  answers: [{
    questionIndex: Number,
    selectedAnswer: Number,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  // Track if this was the first attempt (for badge eligibility)
  isFirstAttempt: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one record per user per quiz
userQuizRecordSchema.index({ userId: 1, quizId: 1 }, { unique: true });

// Additional indexes for efficient queries
userQuizRecordSchema.index({ userId: 1, submittedAt: -1 });
userQuizRecordSchema.index({ chapter: 1, submittedAt: -1 });
userQuizRecordSchema.index({ isFirstAttempt: 1 });

export default mongoose.model('UserQuizRecord', userQuizRecordSchema);