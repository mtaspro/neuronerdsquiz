import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
    trim: true
  },
  examDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;