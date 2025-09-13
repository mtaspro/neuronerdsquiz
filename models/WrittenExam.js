import mongoose from 'mongoose';

const writtenExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: String,
  chapter: String,
  totalMarks: { type: Number, required: true },
  timeLimit: { type: Number, default: 180 }, // minutes
  expireDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionPapers: [{ type: String }], // Array of Cloudinary URLs
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('WrittenExam', writtenExamSchema);