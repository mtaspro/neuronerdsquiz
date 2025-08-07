import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  subject: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  visible: {
    type: Boolean,
    default: true
  },
  practiceMode: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Chapter', chapterSchema); 