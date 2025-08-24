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

  // Send daily calendar update via NeuraX
  async sendDailyCalendarUpdate() {
    try {
      console.log('📅 Generating daily calendar update via NeuraX...');
      
      // Get the calendar group setting
      const calendarGroupSetting = await WhatsAppSettings.findOne({ 
        settingKey: 'dailyCalendarGroup' 
      });

      if (!calendarGroupSetting || !calendarGroupSetting.settingValue) {
        console.log('⚠️ No calendar group configured for daily updates');
        return;
      }

      // Generate calendar data
      const calendarData = await this.calendarService.generateCalendarData();
      
      // Create prompt for NeuraX
      const prompt = `Generate a beautiful daily calendar update message with the following data:

Day: ${calendarData.dayName}
English Date: ${calendarData.englishDate}
Bangla Date: ${calendarData.banglaDate}
Hijri Date: ${calendarData.hijriDate}
Holidays: ${calendarData.hasHolidays ? calendarData.holidays.join(', ') : 'None'}

Format it exactly like this:
📅 **Today:** [Day, Date]
🗓️ **English Date:** [Date]
🗓️ **বাংলা তারিখ:** [Bangla Date]
🕌 **Hijri Date:** [Hijri Date]

${calendarData.hasHolidays ? '🎉 **Special:** [Holidays]' : '💡 *No special events today. Let's make it productive!*'}

Add appropriate wishes and motivational message at the end based on the holidays or general positivity.`;

      // Send to NeuraX AI
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || 'http://localhost:5000';
      
      const aiResponse = await axios.post(`${apiUrl}/api/ai-chat`, {
        message: prompt,
        conversationId: 'daily-calendar-' + new Date().toISOString().split('T')[0]
      });

      const neuraXMessage = aiResponse.data.response;
      
      // Send NeuraX response to WhatsApp group
      await whatsappService.sendGroupMessage(calendarGroupSetting.settingValue, neuraXMessage);
      
      console.log('✅ Daily calendar update sent via NeuraX successfully');
      console.log('📝 NeuraX Message:', neuraXMessage);
      
    } catch (error) {
      console.error('❌ Error sending daily calendar update via NeuraX:', error);
      
      // Fallback to direct message if NeuraX fails
      try {
        const calendarData = await this.calendarService.generateCalendarData();
        const fallbackMessage = `📅 **Today:** ${calendarData.dayName}, ${calendarData.englishDate}\n🗓️ **English Date:** ${calendarData.englishDate}\n🗓️ **বাংলা তারিখ:** ${calendarData.banglaDate}\n🕌 **Hijri Date:** ${calendarData.hijriDate}\n\n${calendarData.hasHolidays ? `🎉 **Special:** ${calendarData.holidays.join(', ')}` : '💡 *No special events today. Let\'s make it productive!*'}`;
        
        const calendarGroupSetting = await WhatsAppSettings.findOne({ settingKey: 'dailyCalendarGroup' });
        if (calendarGroupSetting?.settingValue) {
          await whatsappService.sendGroupMessage(calendarGroupSetting.settingValue, fallbackMessage);
          console.log('✅ Fallback calendar message sent');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
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