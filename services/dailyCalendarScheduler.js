import cron from 'node-cron';
import CalendarService from './calendarService.js';
import whatsappService from './whatsappService.js';
import WhatsAppSettings from '../models/WhatsAppSettings.js';
import Exam from '../models/Exam.js';

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
      
      // Get upcoming exams
      const examData = await this.getUpcomingExams();
      
      // Create prompt for NeuraX
      const examInfo = examData.length > 0 ? examData.map(e => e.daysLeft === 0 ? `${e.examName} - TODAY` : `${e.examName} in ${e.daysLeft} days`).join(', ') : 'None';
      
      const prompt = `Create a short, witty daily message for students.

Day: ${calendarData.dayName}
Date: ${calendarData.englishDate}
Holidays: ${calendarData.hasHolidays ? calendarData.holidays.join(', ') : 'None'}
Exams: ${examInfo}

Write EXACTLY in this format (no extra lines):
Today: *${calendarData.dayName}, ${calendarData.englishDate}*
${calendarData.hasHolidays ? '🎉 ' + calendarData.holidays.join(', ') + ' - Enjoy responsibly!\n' : ''}${examData.length > 0 ? examData.map(e => e.daysLeft === 0 ? '📚 *' + e.examName + '* - TODAY! 💪\n' : '📚 *' + e.examName + '* in ' + e.daysLeft + ' days\n').join('') : ''}💡 [Add ONE short, clever line with light humor that motivates students - max 15-20 words]`;
      // Send to NeuraX AI
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const aiResponse = await axios.post(`${apiUrl}/api/ai-chat`, {
        message: prompt,
        model: 'x-ai/grok-4.1-fast:free',
        systemPrompt: 'You are NeuraX. Generate concise calendar messages following the exact format provided. NEVER include reasoning tags like <think> or any meta-commentary in your response. Keep the message clean and direct.',
        conversationHistory: []
      });

      let neuraXMessage = aiResponse.data.response;
      
      // Filter out any reasoning tags or thinking sections
      neuraXMessage = neuraXMessage.replace(/<think>[\s\S]*?<\/think>/g, '');
      neuraXMessage = neuraXMessage.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
      neuraXMessage = neuraXMessage.replace(/<.*?>/g, ''); // Remove any other tags
      
      // Send filtered NeuraX response to WhatsApp group
      await whatsappService.sendGroupMessage(calendarGroupSetting.settingValue, neuraXMessage);
      
      console.log('✅ Daily calendar update sent via NeuraX successfully');
      console.log('📝 NeuraX Message:', neuraXMessage);
      
    } catch (error) {
      console.error('❌ Error sending daily calendar update via NeuraX:', error);
      
      // Fallback to direct message if NeuraX fails
      try {
        const calendarData = await this.calendarService.generateCalendarData();
        const examData = await this.getUpcomingExams();
        const examMessages = examData.map(e => e.daysLeft === 0 ? `📚 Exam Alert\n*${e.examName}* - *TODAY*! 💪` : `📚 Exam Alert\n*${e.examName}* in *${e.daysLeft}* days 📖`).join('\n\n');
        
        let fallbackMessage = `Today: *${calendarData.dayName}, ${calendarData.englishDate}*\n\n${calendarData.hasHolidays ? `🎉 Special: ${calendarData.holidays.join(', ')} - Enjoy responsibly!\n\n` : ''}${examMessages ? examMessages + '\n\n' : ''}💡 Stay focused and make today count!`;
        
        // Filter out any reasoning tags or thinking sections
        fallbackMessage = fallbackMessage.replace(/<think>[\s\S]*?<\/think>/g, '');
        fallbackMessage = fallbackMessage.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
        fallbackMessage = fallbackMessage.replace(/<.*?>/g, ''); // Remove any other tags
        
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

  // Get upcoming exams with countdown
  async getUpcomingExams() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const exams = await Exam.find({ 
        isActive: true,
        examDate: { $gte: today }
      }).sort({ examDate: 1 });
      
      return exams.map(exam => {
        const examDate = new Date(exam.examDate);
        examDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          examName: exam.examName,
          examDate: exam.examDate,
          daysLeft
        };
      }).filter(exam => exam.daysLeft >= 0);
    } catch (error) {
      console.error('Error getting upcoming exams:', error);
      return [];
    }
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