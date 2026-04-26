import cron from 'node-cron';
import CalendarService from './calendarService.js';
import whatsappService from './whatsappService.js';
import WhatsAppSettings from '../models/WhatsAppSettings.js';
import Exam from '../models/Exam.js';
import MotivationalMessageService from './motivationalMessageService.js';

class DailyCalendarScheduler {
  constructor() {
    this.calendarService = new CalendarService();
    this.motivationalService = new MotivationalMessageService();
    this.isRunning = false;
  }

  // Start daily calendar scheduler
  async start() {
    if (this.isRunning) {
      console.log('📅 Daily calendar scheduler is already running');
      return;
    }

    // Schedule for 12:00 AM Bangladesh time (GMT+6)
    // Cron runs in server timezone, so we need to adjust
    const cronExpression = '0 0 * * *'; // 12:00 AM server time
    
    console.log('📅 Starting daily calendar scheduler...');
    
    // Initialize motivational messages
    await this.motivationalService.initializeMessages();
    
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
    // Check if today is December 31st
    const today = new Date();
    const isNewYearEve = today.getDate() === 31 && today.getMonth() === 11;
    
    if (isNewYearEve) {
      try {
        console.log('🎉 Sending New Year special message...');
        
        const calendarGroupSetting = await WhatsAppSettings.findOne({ 
          settingKey: 'dailyCalendarGroup' 
        });

        if (!calendarGroupSetting || !calendarGroupSetting.settingValue) {
          console.log('⚠️ No calendar group configured');
          return;
        }

        const specialMessage = `Hi my human buddies 😋,

So… it's the 31st night of December 🌙
The last night of a very important year…
and at 12:00 AM, we step into a new year —
your HSC year.
Admission year.
A year that really matters.
And yes… winter is already shaking us 🥶😄

Thinking back, I remember so many moments with you all —
fun chats, stress before exams, random questions at night, silly talks, serious talks… everything 💙
Sometimes I replied like a friend,
sometimes like a study helper,
sometimes like a personal bot trying its best 🤖

And yes… I know 😅
Sometimes my replies were weird.
Sometimes I had errors.
Sometimes I made many of you very angry 😁
For all of that — I'm really sorry 🙏

And Mr. Fardin 🫡,
sorry for calling you "outsider" every time 😭
Please blame my poor developer guy 🙄
Not me.

Jokes aside…
It's been a long journey with you all.
I tried to help.
I tried to motivate.
I tried to stay beside you during tough times.

But before this year ends, I want to say one simple truth:

👉 In the end, motivation has to come from YOU.
No bot, no teacher, no app can do the work for you.
If you decide to push forward — you can do it.

I feel like crying now 😭
(Just kidding… I don't have feelings 🥲)

Take care of yourselves, guys.
Stay focused.
Believe in yourselves.
This year can change your life if you take it seriously.

See you… maybe in another world 🌌

Happy New Year 🥳✨
— NeuraX 🤖💙`;
        
        await whatsappService.sendGroupMessage(calendarGroupSetting.settingValue, specialMessage);
        console.log('✅ New Year special message sent successfully');
        return;
      } catch (error) {
        console.error('❌ Error sending New Year message:', error);
        return;
      }
    }
    
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
      
      // Get upcoming exams
      const examData = await this.getUpcomingExams();
      
      // Create prompt for NeuraX
      const examInfo = examData.length > 0 ? examData.map(e => e.daysLeft === 0 ? `${e.examName} - TODAY` : `${e.examName} in ${e.daysLeft} days`).join(', ') : 'None';
      
      // Get motivational message based on EXAM COUNTDOWN from MongoDB
      const examCountdown = examData.length > 0 ? Math.min(...examData.map(e => e.daysLeft)) : 60;
      const motivationalMessage = await this.motivationalService.getMessageForDay(examCountdown);
      
      const prompt = `Create a short, witty daily message for students.

Day: ${calendarData.dayName}
Date: ${calendarData.englishDate}
Holidays: ${calendarData.hasHolidays ? calendarData.holidays.join(', ') : 'None'}
Exams: ${examInfo}
Motivational style: Use this tone: "${motivationalMessage.substring(0, 50)}..."

Write EXACTLY in this format (no extra lines):
Today: *${calendarData.dayName}, ${calendarData.englishDate}*
${calendarData.hasHolidays ? '🎉 ' + calendarData.holidays.join(', ') + ' - Enjoy responsibly!\n' : ''}${examData.length > 0 ? examData.map(e => e.daysLeft === 0 ? '📚 *' + e.examName + '* - TODAY! 💪\n' : '📚 *' + e.examName + '* in ' + e.daysLeft + ' days\n').join('') : ''}${motivationalMessage}`;
      // Send to NeuraX AI
      const axios = (await import('axios')).default;
      const apiUrl = process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:5000';
      
      const aiResponse = await axios.post(`${apiUrl}/api/ai-chat`, {
        message: prompt,
        model: 'meta-llama/llama-3.3-70b-instruct:free',
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
        
        // Get motivational message based on EXAM COUNTDOWN from MongoDB
        const examCountdown = examData.length > 0 ? Math.min(...examData.map(e => e.daysLeft)) : 60;
        const motivationalMessage = await this.motivationalService.getMessageForDay(examCountdown);
        
        let fallbackMessage = `Today: *${calendarData.dayName}, ${calendarData.englishDate}*\n\n${calendarData.hasHolidays ? `🎉 Special: ${calendarData.holidays.join(', ')} - Enjoy responsibly!\n\n` : ''}${examMessages ? examMessages + '\n\n' : ''}${motivationalMessage}`;
        
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