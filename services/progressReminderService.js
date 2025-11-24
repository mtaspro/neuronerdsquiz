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
      
      const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
      const totalProgress = Math.round((userProgress.completedChapters.length / totalChapters) * 100);

      let message = timeOfDay === 'morning' 
        ? `🌅 Good Morning ${user.name}!\n\n`
        : `🌙 Good Evening ${user.name}!\n\n`;

      message += `📊 *Your Progress Update*\n\n`;
      message += `✅ Overall Progress: *${totalProgress}%*\n`;
      message += `🔥 Study Streak: *${userProgress.streakDays} days*\n\n`;

      // Add exam reminders
      const upcomingExam = exams.find(exam => new Date(exam.date) > new Date());
      if (upcomingExam) {
        const daysLeft = Math.ceil((new Date(upcomingExam.date) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          message += `⚠️ *${upcomingExam.name}* in ${daysLeft} days!\n\n`;
        }
      }

      // Add motivation
      if (totalProgress < 50) {
        message += `💪 Keep pushing! Every chapter counts.\n`;
      } else if (totalProgress < 80) {
        message += `🎯 Great progress! You're more than halfway there!\n`;
      } else {
        message += `🏆 Outstanding! You're almost at the finish line!\n`;
      }

      message += `\n_Track your progress at neuronerdsquiz.vercel.app_`;

      try {
        await whatsappService.sendMessage(user.phone, message);
        console.log(`✅ Reminder sent to ${user.name}`);
      } catch (error) {
        console.error(`Failed to send reminder to ${user.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Progress reminder service error:', error);
  }
}
