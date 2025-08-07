import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  chapter: { type: String, required: true },
  subject: { type: String },
  difficulty: { type: String },
  duration: { type: Number }, // in seconds
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminVisible: { type: Boolean, default: true }
});

export default mongoose.model('Quiz', quizSchema);