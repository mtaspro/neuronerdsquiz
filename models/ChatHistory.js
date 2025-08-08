import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
  }
});

export default mongoose.model('ChatHistory', chatHistorySchema);