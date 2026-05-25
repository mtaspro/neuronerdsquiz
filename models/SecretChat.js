import mongoose from 'mongoose';

const secretChatSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, index: true },
  realNumber: { type: String, index: true }, // Real WhatsApp number for mapping
  friendName: String,
  message: { type: String, required: true },
  encrypted: { type: String, required: true },
  sender: { type: String, enum: ['friend', 'me'], required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  /** WhatsApp message key for sending read receipts via Baileys */
  waKey: {
    remoteJid: String,
    id: String,
    fromMe: { type: Boolean, default: false },
    participant: String
  },
  waMarkedRead: { type: Boolean, default: false }
});

export default mongoose.model('SecretChat', secretChatSchema);
