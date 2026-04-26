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
    enum: ['insult', 'mock_praise', 'absurd_twist', 'confidence_warning', 'irony_hit'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
motivationalMessageSchema.index({ isUsed: 1, usedDate: 1 });
motivationalMessageSchema.index({ dayNumber: 1 });

const MotivationalMessage = mongoose.model('MotivationalMessage', motivationalMessageSchema);

export default MotivationalMessage;
