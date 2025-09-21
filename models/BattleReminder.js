import mongoose from 'mongoose';

const battleReminderSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  topics: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('BattleReminder', battleReminderSchema);