import mongoose from 'mongoose';

const motivationalMessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  dayNumber: {
    type: Number,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedDate: {
    type: Date,
    default: null
  },
  category: {
    type: String,
    enum: ['insult', 'mock_praise', 'absurd_twist', 'confidence_warning', 'irony_hit', 'denial', 'contrast', 'pressure', 'final_warning', 'final_hit'],
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
motivationalMessageSchema.index({ isUsed: 1, usedDate: 1 });
motivationalMessageSchema.index({ dayNumber: 1 });

const MotivationalMessage = mongoose.model('MotivationalMessage', motivationalMessageSchema);
const MotivationalSequence = mongoose.model('MotivationalSequence', motivationalSequenceSchema);

export default MotivationalMessage;
export { MotivationalSequence };
