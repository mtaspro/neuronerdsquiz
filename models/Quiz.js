const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  chapter: { type: String, required: true },
  subject: { type: String },
  difficulty: { type: String },
  duration: { type: Number } // in seconds
});

export default mongoose.model('Quiz', quizSchema);