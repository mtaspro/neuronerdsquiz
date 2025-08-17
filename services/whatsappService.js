import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import qrcode from 'qrcode-terminal';

class WhatsAppService {
  constructor() {
    if (WhatsAppService.instance) {
      return WhatsAppService.instance;
    }
    
    this.sock = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.isInitializing = false;
    this.currentQR = null;
    
    WhatsAppService.instance = this;
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ WhatsApp initialization already in progress...');
      return;
    }
    
    if (this.isConnected) {
      console.log('✅ WhatsApp already connected');
      return;
    }
    
    this.isInitializing = true;
    
    try {
      // Check if session folder exists
      if (!fs.existsSync('./session')) {
        console.log('📱 Session folder not found. QR code scanning required.');
        console.log('🔄 Please scan the QR code below with your WhatsApp:');
      }
      
      const { state, saveCreds } = await useMultiFileAuthState('./session');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: !fs.existsSync('./session')
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update) => {
        const { qr } = update;
        
        if (qr) {
          console.log('📱 Scan this QR code with WhatsApp:');
          qrcode.generate(qr, { small: true });
          this.currentQR = qr; // Store QR for web display
        }
        
        this.handleConnection(update);
      });

      // Listen for incoming messages
      this.sock.ev.on('messages.upsert', this.handleIncomingMessage.bind(this));
      
      console.log('WhatsApp service initialized');
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  handleConnection(update) {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log('Connection closed due to ', lastDisconnect?.error?.message || 'Unknown error');
      
      // Handle specific error cases
      if (lastDisconnect?.error?.message?.includes('conflict')) {
        console.log('⚠️ WhatsApp Web conflict detected. Another session is active.');
        console.log('💡 Close other WhatsApp Web sessions and restart server.');
        return; // Don't reconnect on conflict
      }
      
      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.initialize(), 5000); // Wait 5 seconds before reconnecting
      } else {
        console.log('❌ Max reconnection attempts reached or logged out');
      }
      
      this.isConnected = false;
    } else if (connection === 'open') {
      console.log('✅ WhatsApp connected');
      this.isConnected = true;
      this.reconnectAttempts = 0; // Reset counter on successful connection
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isConnected || !this.sock) {
      console.log('❌ WhatsApp not connected');
      return { success: false, error: 'WhatsApp not connected' };
    }
    
    try {
      // Always remove + sign if present
      const cleanPhone = phoneNumber.replace('+', '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      console.log(`📤 Sending to ${jid}: ${message}`);
      
      // Simple send without complex retry logic
      const result = await this.sock.sendMessage(jid, { 
        text: message 
      });
      
      console.log('✅ Message sent:', result?.key?.id || 'success');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Send failed:', error.message);
      
      // Try once more with different format
      try {
        const cleanRetryPhone = phoneNumber.replace('+', '');
        const jid = `${cleanRetryPhone}@s.whatsapp.net`;
        console.log(`🔄 Retry with format: ${jid}`);
        
        await this.sock.sendMessage(jid, { text: message });
        console.log('✅ Retry successful');
        return { success: true };
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
        return { success: false, error: `Both attempts failed: ${error.message}` };
      }
    }
  }



  async broadcastMessage(phoneNumbers, message) {
    if (!this.isConnected || !phoneNumbers.length) return false;
    
    const results = [];
    for (const phone of phoneNumbers) {
      const result = await this.sendMessage(phone, message);
      results.push({ phone, success: result });
    }
    return results;
  }

  getQRCode() {
    return this.currentQR;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasQR: !!this.currentQR,
      isInitializing: this.isInitializing
    };
  }

  async getGroups() {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      const chats = await this.sock.groupFetchAllParticipating();
      const groups = Object.values(chats).map(group => ({
        id: group.id,
        name: group.subject,
        participants: group.participants?.length || 0
      }));
      
      return { success: true, groups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendGroupMessage(groupId, message) {
    if (!this.isConnected || !this.sock) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    try {
      console.log(`📤 Sending group message to ${groupId}: ${message}`);
      
      await this.sock.sendMessage(groupId, { text: message });
      console.log('✅ Group message sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Group message failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async handleIncomingMessage(m) {
    try {
      const message = m.messages[0];
      if (!message || message.key.fromMe) return; // Ignore our own messages

      const messageText = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text || '';
      
      // Check if message starts with @n
      if (messageText.startsWith('@n ')) {
        const actualMessage = messageText.substring(3); // Remove '@n '
        const senderPhone = message.key.remoteJid.replace('@s.whatsapp.net', '');
        const senderName = message.pushName || senderPhone;
        
        console.log(`📬 Inbox message from ${senderName} (${senderPhone}): ${actualMessage}`);
        
        // Save to user inbox
        await this.saveToUserInbox(senderPhone, senderName, actualMessage);
      }
    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  }

  async saveToUserInbox(senderPhone, senderName, message) {
    try {
      const User = (await import('../models/User.js')).default;
      const UserMessage = (await import('../models/UserMessage.js')).default;
      
      // Try to find user by phone number (handle both +880 and 880 formats)
      let recipient = await User.findOne({ phoneNumber: senderPhone });
      
      // If not found, try with +880 prefix
      if (!recipient && !senderPhone.startsWith('+')) {
        recipient = await User.findOne({ phoneNumber: `+${senderPhone}` });
      }
      
      // If still not found, try without +880 prefix
      if (!recipient && senderPhone.startsWith('+')) {
        recipient = await User.findOne({ phoneNumber: senderPhone.substring(1) });
      }
      
      if (!recipient) {
        console.log(`⚠️ No user found with phone ${senderPhone}`);
        return;
      }

      // Save message to inbox
      const inboxMessage = new UserMessage({
        recipientId: recipient._id,
        senderPhone: senderPhone,
        senderName: senderName,
        message: message
      });
      
      await inboxMessage.save();
      console.log(`✅ Message saved to ${recipient.username}'s inbox`);
    } catch (error) {
      console.error('❌ Error saving to inbox:', error);
    }
  }
}

// Ensure only one instance per process
if (!global.whatsappServiceInstance) {
  global.whatsappServiceInstance = new WhatsAppService();
}

export default global.whatsappServiceInstance;