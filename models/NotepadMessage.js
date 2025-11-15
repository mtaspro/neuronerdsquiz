import mongoose from 'mongoose';

const notepadMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['sent', 'received'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sender: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

notepadMessageSchema.index({ userId: 1, groupId: 1, timestamp: -1 });

export default mongoose.model('NotepadMessage', notepadMessageSchema);
