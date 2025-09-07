import mongoose from 'mongoose';

const writtenSubmissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'WrittenExam', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  answerImages: [{ type: String }], // Array of image URLs
  markedImages: [{ type: String }], // Array of marked image URLs by examiner
  status: { 
    type: String, 
    enum: ['started', 'pending', 'graded', 'rejected'], 
    default: 'started' 
  },
  marksObtained: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true },
  examinerComments: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  examStartTime: { type: Date },
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model('WrittenSubmission', writtenSubmissionSchema);