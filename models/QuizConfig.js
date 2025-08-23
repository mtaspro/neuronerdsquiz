import mongoose from 'mongoose';

const quizConfigSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true,
    unique: true
  },
  chapterName: {
    type: String,
    required: true
  },
  examQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  battleQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  negativeScoring: {
    type: Boolean,
    default: false
  },
  negativeScore: {
    type: Number,
    default: -1,
    max: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('QuizConfig', quizConfigSchema);