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
      'opening', 'progress', 'motivation', 'funny', 'celebration',
      'final_push', 'finale', 'study_tip', 'unit_based', 'subject_focus'
    ],
    required: true
  },
  unit: {
    type: String,
    default: null
  },
  subject: {
    type: String,
    default: null
  },
  generatedPrompt: {
    type: String,
    default: null
  },
  generatedByAI: {
    type: Boolean,
    default: false
  },
  aiModel: {
    type: String,
    default: null
  },
  isReusable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

motivationalMessageSchema.index({ date: 1 });
motivationalMessageSchema.index({ category: 1 });
motivationalMessageSchema.index({ examsRemaining: 1 });

const motivationalSequenceSchema = new mongoose.Schema({
  currentDay: {
    type: Number,
    default: 1
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

const MotivationalMessage = mongoose.model('MotivationalMessage', motivationalMessageSchema);
const MotivationalSequence = mongoose.model('MotivationalSequence', motivationalSequenceSchema);

export default MotivationalMessage;
export { MotivationalSequence };
