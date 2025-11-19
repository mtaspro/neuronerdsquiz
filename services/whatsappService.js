import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const whatsappBot = require('../whatsapp-bot.cjs');

class WhatsAppService {
  async sendMessage(phoneNumber, message) {
    try {
      await whatsappBot.sendMessage(phoneNumber, message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendGroupMessage(groupId, message, options = {}) {
    try {
      await whatsappBot.sendGroupMessage(groupId, message, options);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGroupMembers(groupId) {
    try {
      const members = await whatsappBot.getGroupMembers(groupId);
      return members;
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  }

  async getGroups() {
    try {
      const groups = await whatsappBot.getGroups();
      return { success: true, groups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async broadcastBattleNotification(phoneNumbers, roomId, chapter) {
    const results = [];
    for (const phone of phoneNumbers) {
      const result = await this.sendMessage(phone, 
        `🔥 *QUIZ BATTLE STARTED!* 🔥\n\n⚔️ Chapter: *${chapter}*\n🎯 Room: ${roomId}\n\nThe epic battle has begun! ⚡`
      );
      results.push(result);
    }
    return results;
  }

  async sendBattleNotification(groupId, roomId, chapter, type) {
    try {
      let message = '';
      if (type === 'start') {
        message = `🔥 *QUIZ BATTLE STARTED!* 🔥\n\n⚔️ Chapter: *${chapter}*\n🎯 Room: ${roomId}\n\nThe epic battle has begun! ⚡`;
      } else if (type === 'end') {
        message = `🏁 *BATTLE ENDED!* 🏁\n\nRoom: ${roomId}\nChapter: ${chapter}\n\nCheck results in the app! 🏆`;
      }
      await whatsappBot.sendGroupMessage(groupId, message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getConnectionStatus() {
    return { isConnected: whatsappBot.getConnectionStatus() };
  }

  get sock() {
    return whatsappBot.getSock();
  }

  async initialize() {
    console.log('🚀 Starting integrated WhatsApp bot...');
    await whatsappBot.startWhatsAppBot();
  }
}

export default new WhatsAppService();
