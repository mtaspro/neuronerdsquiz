import cron from 'node-cron';
import UserProgress from '../models/UserProgress.js';
import User from '../models/User.js';
import ProgressSubject from '../models/ProgressSubject.js';
import ProgressExam from '../models/ProgressExam.js';
import whatsappService from './whatsappService.js';

// Send reminders twice daily: 9 AM and 7 PM
export function startProgressReminderService() {
  // 9 AM reminder
  cron.schedule('0 9 * * *', async () => {
    await sendProgressReminders('morning');
  });

  // 7 PM reminder
  cron.schedule('0 19 * * *', async () => {
    await sendProgressReminders('evening');
  });

  console.log('📊 Progress reminder service started');
}

async function sendProgressReminders(timeOfDay) {
  try {
    const usersWithReminders = await UserProgress.find({ whatsappReminder: true }).populate('userId');
    
    for (const userProgress of usersWithReminders) {
      const user = await User.findById(userProgress.userId);
      if (!user?.phone) continue;

      const subjects = await ProgressSubject.find({ isActive: true });
      const exams = await ProgressExam.find({ isActive: true }).sort('date');
      
      // Calculate HSC progress
      const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
      const hscProgress = Math.round((userProgress.completedChapters.length / totalChapters) * 100);
      
      // Calculate Test exam progress
      let testProgress = 0;
      const testExam = exams[0];
      if (testExam?.syllabus?.length) {
        const testTotal = testExam.syllabus.reduce((sum, syl) => sum + (syl.chapters?.length || 0), 0);
        const testCompleted = userProgress.completedChapters.filter(c =>
          testExam.syllabus.some(syl => syl.subjectId.toString() === c.subjectId.toString() && syl.chapters.includes(c.chapter))
        ).length;
        testProgress = Math.round((testCompleted / testTotal) * 100);
      }

      // Create progress summary for AI
      const progressSummary = `User: ${user.name}\nHSC Progress: ${hscProgress}%\nTest Exam Progress: ${testProgress}%\nStudy Streak: ${userProgress.streakDays} days\nTime: ${timeOfDay}`;
      
      // Get upcoming exam info
      let examInfo = '';
      const upcomingExam = exams.find(exam => new Date(exam.date) > new Date());
      if (upcomingExam) {
        const daysLeft = Math.ceil((new Date(upcomingExam.date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          examInfo = `Upcoming: ${upcomingExam.name} in ${daysLeft} days`;
        }
      }

      // Generate AI message
      try {
        const axios = (await import('axios')).default;
        const aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: 'qwen/qwen3-235b-a22b:free',
          messages: [{
            role: 'user',
            content: `Generate a motivational WhatsApp progress reminder message (max 150 words) based on:\n${progressSummary}\n${examInfo}\n\nInclude: greeting, HSC & Test progress percentages, streak, exam reminder if any, and motivation. Use emojis. End with "Track at https://neuronerdsquiz.vercel.app/progress"`
          }]
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        const aiMessage = aiResponse.data.choices[0].message.content.trim();
        
        await whatsappService.sendMessage(user.phone, aiMessage);
        console.log(`✅ AI reminder sent to ${user.name}`);
      } catch (error) {
        console.error(`Failed to send reminder to ${user.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Progress reminder service error:', error);
  }
}
