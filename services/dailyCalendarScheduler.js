import cron from 'node-cron';
import CalendarService from './calendarService.js';
import whatsappService from './whatsappService.js';
import WhatsAppSettings from '../models/WhatsAppSettings.js';

class DailyCalendarScheduler {
  constructor() {
    this.calendarService = new CalendarService();
    this.isRunning = false;
  }

  // Start the daily calendar scheduler
  start() {
    if (this.isRunning) {
      console.log('📅 Daily calendar scheduler is already running');
      return;
    }

    // Schedule for 12:00 AM Bangladesh time (GMT+6)
    // Cron runs in server timezone, so we need to adjust
    const cronExpression = '0 0 * * *'; // 12:00 AM server time
    
    console.log('📅 Starting daily calendar scheduler...');
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.sendDailyCalendarUpdate();
    }, {
      scheduled: true,
      timezone: 'Asia/Dhaka'
    });

    this.isRunning = true;
    console.log('✅ Daily calendar scheduler started - will run at 12:00 AM Bangladesh time');
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.isRunning = false;
      console.log('🛑 Daily calendar scheduler stopped');
    }
  }

  // Send daily calendar update
  async sendDailyCalendarUpdate() {
    try {
      console.log('📅 Generating daily calendar update...');
      
      // Get the calendar group setting
      const calendarGroupSetting = await WhatsAppSettings.findOne({ 
        settingKey: 'dailyCalendarGroup' 
      });

      if (!calendarGroupSetting || !calendarGroupSetting.settingValue) {
        console.log('⚠️ No calendar group configured for daily updates');
        return;
      }

      // Generate the daily message
      const message = await this.calendarService.generateDailyMessage();
      
      // Send to WhatsApp group
      await whatsappService.sendGroupMessage(calendarGroupSetting.settingValue, message);
      
      console.log('✅ Daily calendar update sent successfully');
      console.log('📝 Message:', message);
      
    } catch (error) {
      console.error('❌ Error sending daily calendar update:', error);
    }
  }

  // Manual trigger for testing
  async triggerManually() {
    console.log('🔧 Manually triggering daily calendar update...');
    await this.sendDailyCalendarUpdate();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDate() : null
    };
  }
}

export default DailyCalendarScheduler;