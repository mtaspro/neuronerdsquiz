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
  }
}, {
  timestamps: true
});

export default mongoose.model('Chapter', chapterSchema); 