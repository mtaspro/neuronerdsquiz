import mongoose from 'mongoose';

const secretChatSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, index: true },
  realNumber: { type: String, index: true }, // Real WhatsApp number for mapping
  friendName: String,
  message: { type: String, required: true },
  encrypted: { type: String, required: true },
  sender: { type: String, enum: ['friend', 'me'], required: true },
  timestamp: { type: Date, default: Date.now, index: true }
});

export default mongoose.model('SecretChat', secretChatSchema);
