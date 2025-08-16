import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
  }

  async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('./session');
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', this.handleConnection.bind(this));
      
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
    if (!this.isConnected || !this.sock) return false;
    
    try {
      const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message });
      return true;
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return false;
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