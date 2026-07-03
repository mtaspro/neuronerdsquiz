import mongoose from 'mongoose';

const motivationalMessageSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },
  message: {
    type: String,
    required: true
  },
  examsRemaining: {
    type: Number,
    required: true
  },
  nextExam: {
    type: String,
    default: null
  },
  category: {
    type: String,
    enum: [
      'opening', 'progress', 'motivation', 'funny', 'physics_arc',
      'celebration', 'chemistry_arc', 'final_push', 'math_arc', 'finale'
    ],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema for tracking motivational sequence state
const motivationalSequenceSchema = new mongoose.Schema({
  currentDay: {
    type: Number,
    default: 68 // Start from Day 68
  },
  lastUsedDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
motivationalMessageSchema.index({ date: 1 });
motivationalMessageSchema.index({ category: 1 });
motivationalMessageSchema.index({ examsRemaining: 1 });

const MotivationalMessage = mongoose.model('MotivationalMessage', motivationalMessageSchema);
const MotivationalSequence = mongoose.model('MotivationalSequence', motivationalSequenceSchema);

export default MotivationalMessage;
export { MotivationalSequence };
