import mongoose from 'mongoose';

const progressExamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  syllabus: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgressSubject' },
    chapters: [{ type: String }]
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('ProgressExam', progressExamSchema);
