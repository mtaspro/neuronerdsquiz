import mongoose from 'mongoose';

const whatsAppMessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true, unique: true },
  chatId: { type: String, required: true }, // Group ID or personal chat ID
  chatType: { type: String, enum: ['group', 'personal'], required: true },
  chatName: String, // Group name or contact name
  senderId: String, // Sender's WhatsApp ID
  senderName: String, // Sender's display name
  senderPhone: String, // Extracted phone number
  messageText: String,
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'other'],
    default: 'text'
  },
  mediaUrl: String, // For media messages
  caption: String, // For media with captions
  isFromBot: { type: Boolean, default: false },
  timestamp: { type: Date, required: true },
  quotedMessageId: String, // If replying to another message
  mentionedUsers: [String], // Array of mentioned user IDs
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient queries
whatsAppMessageSchema.index({ chatId: 1, timestamp: -1 });
whatsAppMessageSchema.index({ messageId: 1 });
whatsAppMessageSchema.index({ senderId: 1, timestamp: -1 });

export default mongoose.model('WhatsAppMessage', whatsAppMessageSchema);