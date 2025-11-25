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
      if (!user?.phoneNumber) continue;

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

      // Use AI summary if available, otherwise create basic summary
      const progressSummary = userProgress.aiSummary || `HSC Progress: ${hscProgress}%\nTest Exam Progress: ${testProgress}%\nStudy Streak: ${userProgress.streakDays} days`;
      
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
        const greeting = timeOfDay === 'morning' ? '🌅 Good Morning' : '🌆 Good Evening';
        let message = `${greeting} ${user.username}!\n\n📊 *Your Progress Update*\n\n`;
        message += progressSummary + '\n\n';
        message += `🔥 Study Streak: *${userProgress.streakDays} days*\n\n`;
        
        if (examInfo) {
          message += `⚠️ ${examInfo}\n\n`;
        }
        
        message += `📚 Keep up the great work!\n\n_Track your progress at neuronerdsquiz.vercel.app/progress_`;
        
        await whatsappService.sendMessage(user.phoneNumber, message);
        console.log(`✅ Reminder sent to ${user.username}`);
      } catch (error) {
        console.error(`Failed to send reminder to ${user.username}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Progress reminder service error:', error);
  }
}
