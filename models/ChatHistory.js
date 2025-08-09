import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    id: Number,
    type: {
      type: String,
      enum: ['user', 'bot'],
      required: true
    },
    content: String,
    image: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
chatHistorySchema.index({ userId: 1, lastUpdated: -1 });

export default mongoose.model('ChatHistory', chatHistorySchema);