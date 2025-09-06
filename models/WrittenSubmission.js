import mongoose from 'mongoose';

const writtenSubmissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'WrittenExam', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  answerImages: [{ type: String, required: true }], // Array of image URLs
  markedImages: [{ type: String }], // Array of marked image URLs by examiner
  status: { 
    type: String, 
    enum: ['pending', 'graded', 'rejected'], 
    default: 'pending' 
  },
  marksObtained: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  examinerComments: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('WrittenSubmission', writtenSubmissionSchema);