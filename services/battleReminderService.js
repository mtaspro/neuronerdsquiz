import cron from 'node-cron';
import BattleReminder from '../models/BattleReminder.js';
import WhatsAppSettings from '../models/WhatsAppSettings.js';
import whatsappService from './whatsappService.js';

class BattleReminderService {
  constructor() {
    this.isRunning = false;
    this.reminderTime = '09:00'; // Default 9:00 AM
  }

  start() {
    if (this.isRunning) return;
    
    // Schedule daily reminder at configured time
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      await this.sendDailyReminder();
    }, {
      scheduled: true,
      timezone: 'Asia/Dhaka'
    });
    
    this.isRunning = true;
    console.log('✅ Battle Reminder Service started - Daily reminders at 9:00 AM');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Battle Reminder Service stopped');
    }
  }

  async updateReminderTime(time) {
    this.reminderTime = time;
    
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    const [hour, minute] = time.split(':');
    this.cronJob = cron.schedule(`${minute} ${hour} * * *`, async () => {
      await this.sendDailyReminder();
    }, {
      scheduled: true,
      timezone: 'Asia/Dhaka'
    });
    
    console.log(`⏰ Battle reminder time updated to ${time}`);
  }

  async sendDailyReminder() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const reminder = await BattleReminder.findOne({
        date: today,
        isActive: true
      });
      
      if (!reminder) {
        console.log('📅 No battle reminder set for today');
        return;
      }
      
      const setting = await WhatsAppSettings.findOne({ 
        settingKey: 'battleNotificationGroup' 
      });
      
      if (!setting?.settingValue) {
        console.log('❌ No WhatsApp group configured for battle reminders');
        return;
      }
      
      const message = `🎯 *DAILY BATTLE REMINDER* 🎯\n\n📅 *Today's Battle Topics:*\n\n${reminder.topics}\n\n⏰ *Get Ready!* Battles will start soon!\n\n🔥 Join from Dashboard or click the battle link when it's shared!\n\n💪 Good luck, warriors! 🏆`;
      
      await whatsappService.sendGroupMessage(setting.settingValue, message);
      console.log('✅ Daily battle reminder sent successfully');
      
    } catch (error) {
      console.error('❌ Failed to send daily battle reminder:', error);
    }
  }

  async triggerManually() {
    console.log('🔄 Manually triggering battle reminder...');
    await this.sendDailyReminder();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      reminderTime: this.reminderTime,
      nextRun: this.cronJob?.nextDate()?.toDate() || null
    };
  }
}

export default new BattleReminderService();