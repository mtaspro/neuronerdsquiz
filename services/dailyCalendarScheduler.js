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
    
    // Initialize motivational messages (AI-generated for DU Admission)
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
      
      // Get calendar data
      const calendarData = await this.calendarService.generateCalendarData();
      
      // Get motivational tone/category from today's seeded message (not the text itself)
      const messageData = await this.motivationalService.getTodayMessage();
      const tone = messageData.category || 'encouraging';
      const daysRemaining = messageData.examsRemaining != null ? messageData.examsRemaining : examData.reduce((min, e) => Math.min(min, e.daysLeft), Infinity);
      
      const examInfo = examData.length > 0 ? examData.map(e => e.daysLeft === 0 ? `${e.examName} - TODAY` : `${e.examName} in ${e.daysLeft} days`).join(', ') : 'None';
      
      // Create prompt for NeuraX — AI generates the motivational closing itself
      const prompt = `Create a short, witty daily WhatsApp message for students.

Day: ${calendarData.dayName}
Date: ${calendarData.englishDate}
Special days: ${calendarData.hasHolidays ? calendarData.holidays.join(', ') : 'None'}
Upcoming exams: ${examInfo}

REQUIRED FORMAT:
Wrap ONLY the final message between these exact markers and nothing else:

@@CALENDAR_MESSAGE_START@@
Today: *${calendarData.dayName}, ${calendarData.englishDate}*
${calendarData.hasHolidays ? '🎉 ' + calendarData.holidays.join(', ') + ' - Enjoy responsibly!\\n' : ''}${examData.length > 0 ? examData.map(e => e.daysLeft === 0 ? '📚 *' + e.examName + '* - TODAY! 💪\\n' : '📚 *' + e.examName + '* in *' + e.daysLeft + '* days 📖\\n').join('') : ''}Your AI-generated motivational closing here (1-2 lines, English only, human-like, slightly roasted, motivational)
@@CALENDAR_MESSAGE_END@@

RULES:
- Put the COMPLETE final message between the markers
- No reasoning, no thought process, no meta-commentary outside the markers
- If you need to think, do it silently, then output ONLY the markers + message
- Max 150 words total inside the markers
- FULLY ENGLISH ONLY — no Bengali, no Bangla, no mixed language
- Human-like, conversational, relatable tone — like a friend giving a reality check
- Include light, funny roasting for students who are not studying seriously, but keep it motivational`;
      // Send to Groq AI directly
      const axios = (await import('axios')).default;
      const groqApiKey = process.env.GROQ_API_KEY;
      
      if (!groqApiKey) {
        throw new Error('GROQ_API_KEY not configured');
      }
      
      const aiResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are NeuraX. Generate concise calendar messages. IMPORTANT: Output ONLY the final message wrapped in these exact markers: @@CALENDAR_MESSAGE_START@@ ... @@CALENDAR_MESSAGE_END@@. Do NOT output reasoning, thought process, or meta-commentary outside the markers. If you think silently, do not show it. The message inside the markers must be FULLY ENGLISH ONLY, human-like, conversational, with light roasting for students who are not studying seriously, but keep it motivational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      const aiContent = aiResponse.data.choices?.[0]?.message?.content || '';
      
      if (!aiContent) {
        throw new Error('Empty response from Groq');
      }
      
      let neuraXMessage = aiContent;
      
      const START_MARKER = '@@CALENDAR_MESSAGE_START@@';
      const END_MARKER = '@@CALENDAR_MESSAGE_END@@';
      
      const startIdx = neuraXMessage.indexOf(START_MARKER);
      const endIdx = neuraXMessage.indexOf(END_MARKER);
      
      if (startIdx >= 0 && endIdx > startIdx) {
        neuraXMessage = neuraXMessage.substring(startIdx + START_MARKER.length, endIdx).trim();
      } else if (startIdx >= 0) {
        const afterStart = neuraXMessage.substring(startIdx + START_MARKER.length);
        const todayMatch = afterStart.match(/Today:[\s\S]*/);
        neuraXMessage = todayMatch ? todayMatch[0].trim() : afterStart.trim();
      } else {
        const todayIndex = neuraXMessage.indexOf('Today:');
        if (todayIndex >= 0) {
          neuraXMessage = neuraXMessage.substring(todayIndex).trim();
        }
      }
      
      // Final safety: if message still doesn't start with "Today:", drop to fallback
      if (!neuraXMessage.startsWith('Today:')) {
        neuraXMessage = null;
      }
      
      if (!neuraXMessage) {
        throw new Error('AI response did not contain a valid calendar message');
      }
      
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
        const examMessages = examData.map(e => e.daysLeft === 0 ? `📚 *${e.examName}* - *TODAY*! 💪` : `📚 *${e.examName}* in *${e.daysLeft}* days 📖`).join('\n\n');
        
        const messageData = await this.motivationalService.getTodayMessage();
        
        const genericMotivational = {
          finale: '🎉 Admission test is over! Congratulations! You did it!',
          final_push: '🔥 Final push! Stay focused, stay strong — you are almost there!',
          motivation: '💪 Keep pushing forward! Every day counts!',
          progress: '📚 Steady progress! Keep building that momentum!',
          opening: '🚀 Stay focused! The journey has just begun — make it count!',
          celebration: '🎉 Keep it up! Celebrate every small win!',
          funny: '😄 Stay sane! Balance study with breaks!',
          study_tip: '📖 Study smart, not just hard!',
          unit_based: '🎯 Master your units one by one!',
          subject_focus: '📝 Focus on your weak subjects today!'
        };
        
        const fallbackMotivation = genericMotivational[messageData.category] || genericMotivational['motivation'];
        
        let fallbackMessage = `Today: *${calendarData.dayName}, ${calendarData.englishDate}*\n\n${calendarData.hasHolidays ? `🎉 Special: ${calendarData.holidays.join(', ')} - Enjoy responsibly!\n\n` : ''}${examMessages ? examMessages + '\n\n' : ''}${fallbackMotivation}`;
        
        fallbackMessage = fallbackMessage.replace(/<think>[\s\S]*?<\/think>/g, '');
        fallbackMessage = fallbackMessage.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
        fallbackMessage = fallbackMessage.replace(/<.*?>/g, '');
        
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