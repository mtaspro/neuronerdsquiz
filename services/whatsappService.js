import axios from 'axios';

const WHATSAPP_API = process.env.WHATSAPP_API_URL || 'http://localhost:5001';

class WhatsAppService {
  async sendMessage(phoneNumber, message) {
    try {
      const response = await axios.post(`${WHATSAPP_API}/send-message`, {
        phoneNumber,
        message
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendGroupMessage(groupId, message) {
    try {
      const response = await axios.post(`${WHATSAPP_API}/send-group-message`, {
        groupId,
        message
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGroups() {
    try {
      const response = await axios.get(`${WHATSAPP_API}/groups`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async broadcastBattleNotification(phoneNumbers, roomId, chapter) {
    // Send to all phone numbers
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
      const response = await axios.post(`${WHATSAPP_API}/battle-notification`, {
        groupId,
        roomId,
        chapter,
        type
      });
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getConnectionStatus() {
    return { isConnected: true };
  }

  async initialize() {
    console.log('✅ WhatsApp service connected to external bot');
  }
}

export default new WhatsAppService();
