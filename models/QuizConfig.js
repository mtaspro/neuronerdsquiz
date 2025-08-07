const mongoose = require('mongoose');

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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizConfig', quizConfigSchema);