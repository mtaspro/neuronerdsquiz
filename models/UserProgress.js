import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedChapters: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgressSubject' },
    chapter: { type: String }
  }],
  progressHistory: [{
    date: { type: Date, default: Date.now },
    totalProgress: { type: Number },
    beiProgress: { type: Number },
    scienceProgress: { type: Number },
    testProgress: { type: Number, default: 0 }
  }],
  badges: [{ type: String }],
  streakDays: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  whatsappReminder: { type: Boolean, default: false },
  reminderTime: { type: String, default: '09:00' },
  aiSummary: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('UserProgress', userProgressSchema);
