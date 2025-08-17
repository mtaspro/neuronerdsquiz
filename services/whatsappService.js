import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import fs from 'fs';
import qrcode from 'qrcode-terminal';

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
  }

  async initialize() {
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
        }
        
        this.handleConnection(update);
      });
      
      console.log('WhatsApp service initialized');
    } catch (error) {
      console.error('WhatsApp initialization error:', error);
    }
  }

  handleConnection(update) {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      
      if (shouldReconnect) {
        this.initialize();
      }
      this.isConnected = false;
    } else if (connection === 'open') {
      console.log('WhatsApp connected');
      this.isConnected = true;
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isConnected || !this.sock) {
      console.log('❌ WhatsApp not connected');
      return { success: false, error: 'WhatsApp not connected' };
    }
    
    try {
      const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
      console.log(`📤 Sending message to ${jid}: ${message}`);
      
      await this.sock.sendMessage(jid, { text: message });
      console.log('✅ Message sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ WhatsApp send error:', error.message || error);
      return { success: false, error: error.message || 'Failed to send message' };
    }
  }

  async sendGroupMessage(groupId, message) {
    if (!this.isConnected || !this.sock) return false;
    
    try {
      const jid = groupId.includes('@') ? groupId : `${groupId}@g.us`;
      await this.sock.sendMessage(jid, { text: message });
      return true;
    } catch (error) {
      console.error('WhatsApp group send error:', error);
      return false;
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
}

export default new WhatsAppService();