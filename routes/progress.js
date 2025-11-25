import express from 'express';
import { sessionMiddleware } from '../middleware/sessionMiddleware.js';
import ProgressSubject from '../models/ProgressSubject.js';
import ProgressExam from '../models/ProgressExam.js';
import UserProgress from '../models/UserProgress.js';
import User from '../models/User.js';

const router = express.Router();

// Get all subjects with chapters
router.get('/subjects', sessionMiddleware, async (req, res) => {
  try {
    const subjects = await ProgressSubject.find({ isActive: true }).sort('order');
    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get all exams
router.get('/exams', sessionMiddleware, async (req, res) => {
  try {
    const exams = await ProgressExam.find({ isActive: true }).populate('syllabus.subjectId').sort('date');
    res.json({ exams });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get user progress
router.get('/user', sessionMiddleware, async (req, res) => {
  try {
    let progress = await UserProgress.findOne({ userId: req.user.userId }).populate('completedChapters.subjectId');
    if (!progress) {
      progress = await UserProgress.create({ userId: req.user.userId, completedChapters: [], progressHistory: [] });
    }
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

// Update user progress
router.post('/update', sessionMiddleware, async (req, res) => {
  try {
    const { subjectId, chapter, completed } = req.body;
    let progress = await UserProgress.findOne({ userId: req.user.userId });
    
    if (!progress) {
      progress = await UserProgress.create({ userId: req.user.userId, completedChapters: [] });
    }

    const index = progress.completedChapters.findIndex(
      c => c.subjectId.toString() === subjectId && c.chapter === chapter
    );

    if (completed && index === -1) {
      progress.completedChapters.push({ subjectId, chapter });
    } else if (!completed && index !== -1) {
      progress.completedChapters.splice(index, 1);
    }

    // Calculate progress percentages
    const subjects = await ProgressSubject.find({ isActive: true });
    const exams = await ProgressExam.find({ isActive: true }).sort('date');
    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const totalProgress = (progress.completedChapters.length / totalChapters) * 100;

    const beiSubjects = subjects.filter(s => s.category === 'BEI');
    const beiTotal = beiSubjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const beiCompleted = progress.completedChapters.filter(c => 
      beiSubjects.some(s => s._id.toString() === c.subjectId.toString())
    ).length;
    const beiProgress = (beiCompleted / beiTotal) * 100;

    const scienceSubjects = subjects.filter(s => s.category === 'Science');
    const scienceTotal = scienceSubjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const scienceCompleted = progress.completedChapters.filter(c => 
      scienceSubjects.some(s => s._id.toString() === c.subjectId.toString())
    ).length;
    const scienceProgress = (scienceCompleted / scienceTotal) * 100;

    // Calculate Test exam progress
    let testProgress = 0;
    const testExam = exams[0];
    console.log('📊 Test Exam Calculation:');
    console.log('  - Test Exam Found:', !!testExam);
    console.log('  - Test Exam ID:', testExam?._id);
    console.log('  - Test Exam Name:', testExam?.name);
    console.log('  - Syllabus Length:', testExam?.syllabus?.length);
    
    if (testExam?.syllabus?.length) {
      const testTotal = testExam.syllabus.reduce((sum, syl) => sum + (syl.chapters?.length || 0), 0);
      console.log('  - Total Test Chapters:', testTotal);
      
      const testCompleted = progress.completedChapters.filter(c => {
        const match = testExam.syllabus.some(syl => {
          const subjectMatch = syl.subjectId.toString() === c.subjectId.toString();
          const chapterMatch = syl.chapters.includes(c.chapter);
          return subjectMatch && chapterMatch;
        });
        return match;
      });
      
      console.log('  - Completed Test Chapters:', testCompleted.length);
      console.log('  - Completed Chapters Details:', testCompleted.map(c => ({ subject: c.subjectId.toString(), chapter: c.chapter })));
      
      testProgress = testTotal > 0 ? (testCompleted.length / testTotal) * 100 : 0;
      console.log('  - Test Progress:', testProgress + '%');
    } else {
      console.log('  - No test exam syllabus found');
    }

    // Update streak
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = progress.lastActiveDate ? new Date(progress.lastActiveDate).setHours(0, 0, 0, 0) : null;
    
    if (!lastActive || today - lastActive === 86400000) {
      progress.streakDays += 1;
    } else if (today - lastActive > 86400000) {
      progress.streakDays = 1;
    }
    progress.lastActiveDate = new Date();

    // Add to history (once per day)
    const lastHistory = progress.progressHistory[progress.progressHistory.length - 1];
    const lastHistoryDate = lastHistory ? new Date(lastHistory.date).setHours(0, 0, 0, 0) : null;
    
    console.log('📈 Saving to History:');
    console.log('  - Total Progress:', totalProgress);
    console.log('  - BEI Progress:', beiProgress);
    console.log('  - Science Progress:', scienceProgress);
    console.log('  - Test Progress:', testProgress);
    
    if (!lastHistoryDate || today !== lastHistoryDate) {
      progress.progressHistory.push({ totalProgress, beiProgress, scienceProgress, testProgress });
      console.log('  - Added new history entry');
    } else {
      progress.progressHistory[progress.progressHistory.length - 1] = { 
        date: new Date(), totalProgress, beiProgress, scienceProgress, testProgress 
      };
      console.log('  - Updated today\'s history entry');
    }

    // Award badges
    const newBadges = [];
    if (totalProgress >= 50 && !progress.badges.includes('50_complete')) {
      progress.badges.push('50_complete');
      newBadges.push('50_complete');
    }
    if (progress.streakDays >= 7 && !progress.badges.includes('7_day_streak')) {
      progress.badges.push('7_day_streak');
      newBadges.push('7_day_streak');
    }
    
    subjects.forEach(subject => {
      const subjectCompleted = progress.completedChapters.filter(
        c => c.subjectId.toString() === subject._id.toString()
      ).length;
      if (subjectCompleted === subject.chapters.length && !progress.badges.includes(`master_${subject._id}`)) {
        progress.badges.push(`master_${subject._id}`);
        newBadges.push(`master_${subject._id}`);
      }
    });

    // Generate AI summary
    const axios = require('axios');
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000';
    const summaryPrompt = `Generate a brief progress summary for a student with:
- Overall Progress: ${totalProgress.toFixed(1)}%
- BEI Progress: ${beiProgress.toFixed(1)}%
- Science Progress: ${scienceProgress.toFixed(1)}%
- Test Exam Progress: ${testProgress.toFixed(1)}%
- Streak: ${progress.streakDays} days

Provide 2-3 sentences highlighting strengths and areas needing attention.`;
    
    try {
      const aiResponse = await axios.post(`${apiUrl}/api/ai-chat`, {
        message: summaryPrompt,
        model: 'deepseek/deepseek-chat-v3.1:free'
      });
      progress.aiSummary = aiResponse.data.response;
      console.log('🤖 AI Summary generated:', progress.aiSummary);
    } catch (error) {
      console.error('Failed to generate AI summary:', error.message);
    }
    
    await progress.save();
    console.log('✅ Progress saved to database');
    
    // Populate subjectId before sending response
    await progress.populate('completedChapters.subjectId');
    console.log('📤 Sending response with', progress.progressHistory.length, 'history entries');
    console.log('📤 Latest history entry:', progress.progressHistory[progress.progressHistory.length - 1]);
    
    res.json({ success: true, progress, newBadges });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Toggle WhatsApp reminder
router.post('/reminder-toggle', sessionMiddleware, async (req, res) => {
  try {
    const { enabled } = req.body;
    let progress = await UserProgress.findOne({ userId: req.user.userId });
    
    if (!progress) {
      progress = await UserProgress.create({ userId: req.user.userId, whatsappReminder: enabled });
    } else {
      progress.whatsappReminder = enabled;
      await progress.save();
    }
    
    res.json({ success: true, whatsappReminder: progress.whatsappReminder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
});

// SuperAdmin: Add/Edit Subject
router.post('/admin/subject', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Unauthorized' });
    
    const { id, name, order, category, chapters } = req.body;
    
    if (id) {
      await ProgressSubject.findByIdAndUpdate(id, { name, order, category, chapters });
    } else {
      await ProgressSubject.create({ name, order, category, chapters });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save subject' });
  }
});

// SuperAdmin: Delete Subject
router.delete('/admin/subject/:id', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await ProgressSubject.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// SuperAdmin: Add/Edit Exam
router.post('/admin/exam', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Unauthorized' });
    
    const { id, name, date, syllabus } = req.body;
    
    if (id) {
      await ProgressExam.findByIdAndUpdate(id, { name, date, syllabus });
    } else {
      await ProgressExam.create({ name, date, syllabus });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save exam' });
  }
});

// SuperAdmin: Delete Exam
router.delete('/admin/exam/:id', sessionMiddleware, async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Unauthorized' });
    await ProgressExam.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Initialize default subjects (one-time setup)
router.get('/init-subjects', async (req, res) => {
  try {
    const defaultSubjects = [
      { name: 'Bangla 1st Paper', order: 1, category: 'BEI', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'] },
      { name: 'Bangla 2nd Paper', order: 2, category: 'BEI', chapters: ['Grammar 1', 'Grammar 2', 'Grammar 3', 'Composition'] },
      { name: 'English 1st Paper', order: 3, category: 'BEI', chapters: ['Reading', 'Writing', 'Grammar', 'Vocabulary'] },
      { name: 'English 2nd Paper', order: 4, category: 'BEI', chapters: ['Grammar', 'Composition', 'Translation'] },
      { name: 'ICT', order: 5, category: 'BEI', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'] },
      { name: 'Physics 1st Paper', order: 6, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6', 'Chapter 7'] },
      { name: 'Physics 2nd Paper', order: 7, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'] },
      { name: 'Chemistry 1st Paper', order: 8, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'] },
      { name: 'Chemistry 2nd Paper', order: 9, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'] },
      { name: 'Biology 1st Paper', order: 10, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'] },
      { name: 'Biology 2nd Paper', order: 11, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'] },
      { name: 'Higher Math 1st Paper', order: 12, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Chapter 6'] },
      { name: 'Higher Math 2nd Paper', order: 13, category: 'Science', chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'] }
    ];

    for (const subject of defaultSubjects) {
      await ProgressSubject.findOneAndUpdate({ name: subject.name }, subject, { upsert: true });
    }

    res.json({ success: true, message: 'Subjects initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize subjects' });
  }
});

// Get insights
router.get('/insights', sessionMiddleware, async (req, res) => {
  try {
    const { examId } = req.query;
    const progress = await UserProgress.findOne({ userId: req.user.userId }).populate('completedChapters.subjectId');
    const subjects = await ProgressSubject.find({ isActive: true });
    const exams = await ProgressExam.find({ isActive: true }).sort('date');
    
    if (!progress) return res.json({ insights: [] });

    const insights = [];
    let totalChapters, totalProgress;
    
    if (examId) {
      const exam = await ProgressExam.findById(examId);
      if (exam?.syllabus?.length) {
        totalChapters = exam.syllabus.reduce((sum, syl) => sum + (syl.chapters?.length || 0), 0);
        const completed = progress.completedChapters.filter(c =>
          exam.syllabus.some(syl => syl.subjectId.toString() === c.subjectId._id.toString() && syl.chapters.includes(c.chapter))
        ).length;
        totalProgress = Math.round((completed / totalChapters) * 100);
      } else {
        totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
        totalProgress = Math.round((progress.completedChapters.length / totalChapters) * 100);
      }
    } else {
      totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
      totalProgress = Math.round((progress.completedChapters.length / totalChapters) * 100);
    }

    // Overall progress insight
    if (totalProgress >= 70) {
      insights.push({ type: 'success', text: `Amazing! You've completed <span class="text-green-400 font-bold">${totalProgress}%</span> of your syllabus. Keep it up! 🎉` });
    } else if (totalProgress >= 40) {
      insights.push({ type: 'info', text: `You've completed <span class="text-cyan-400 font-bold">${totalProgress}%</span> of your syllabus. Great progress! 📚` });
    } else {
      insights.push({ type: 'warning', text: `You've completed <span class="text-yellow-400 font-bold">${totalProgress}%</span> of your syllabus. Time to accelerate! 🚀` });
    }

    // Subject-specific insights
    let relevantSubjects = subjects;
    let examData = null;
    
    if (examId) {
      examData = await ProgressExam.findById(examId);
      if (examData?.syllabus?.length) {
        relevantSubjects = subjects.filter(s => examData.syllabus.some(syl => syl.subjectId.toString() === s._id.toString()));
      }
    }
    
    for (const subject of relevantSubjects) {
      let completed, totalChapters, percentage;
      
      if (examData) {
        const sylSubject = examData.syllabus?.find(syl => syl.subjectId.toString() === subject._id.toString());
        if (sylSubject?.chapters?.length) {
          totalChapters = sylSubject.chapters.length;
          completed = progress.completedChapters.filter(
            c => c.subjectId._id.toString() === subject._id.toString() && sylSubject.chapters.includes(c.chapter)
          ).length;
          percentage = Math.round((completed / totalChapters) * 100);
        } else {
          continue;
        }
      } else {
        completed = progress.completedChapters.filter(
          c => c.subjectId._id.toString() === subject._id.toString()
        ).length;
        percentage = Math.round((completed / subject.chapters.length) * 100);
      }
      
      if (percentage === 100) {
        insights.push({ type: 'success', text: `${subject.name} mastered! <span class="text-green-400 font-bold">100%</span> complete! 🏆` });
      } else if (percentage < 30) {
        insights.push({ type: 'warning', text: `${subject.name} needs attention. Only <span class="text-yellow-400 font-bold">${percentage}%</span> complete.` });
      }
    }

    // Exam reminders
    const now = new Date();
    exams.forEach(exam => {
      const daysLeft = Math.ceil((new Date(exam.date) - now) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 7) {
        insights.push({ type: 'urgent', text: `⚠️ ${exam.name} is in ${daysLeft} days! Final revision time!` });
      } else if (daysLeft > 7 && daysLeft <= 30) {
        insights.push({ type: 'info', text: `📅 ${exam.name} is in ${daysLeft} days. Stay consistent!` });
      }
    });

    // Streak insight
    if (progress.streakDays >= 7) {
      insights.push({ type: 'success', text: `🔥 ${progress.streakDays} day streak! You're on fire!` });
    }

    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Test reminder
router.post('/test-reminder', sessionMiddleware, async (req, res) => {
  try {
    console.log('📨 Test reminder requested by user:', req.user.userId);
    const user = await User.findById(req.user.userId);
    console.log('👤 User found:', !!user, 'Phone:', user?.phoneNumber);
    
    if (!user?.phoneNumber) {
      console.log('❌ No phone number found for user');
      return res.status(400).json({ error: 'No phone number found. Please add your phone number in profile.' });
    }

    const progress = await UserProgress.findOne({ userId: req.user.userId });
    const exams = await ProgressExam.find({ isActive: true }).sort('date');

    let message = `🌅 Good Morning ${user.username}!\n\n`;
    message += `📊 *Your Progress Update*\n\n`;
    
    // Use AI-generated summary if available
    if (progress?.aiSummary) {
      message += progress.aiSummary + '\n\n';
    }
    
    message += `🔥 Study Streak: *${progress?.streakDays || 0} days*\n\n`;

    const upcomingExam = exams.find(exam => new Date(exam.date) > new Date());
    if (upcomingExam) {
      const daysLeft = Math.ceil((new Date(upcomingExam.date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) {
        message += `⚠️ *${upcomingExam.name}* in ${daysLeft} days!\n\n`;
      }
    }

    message += `📚 Keep up the great work, ${user.username}!`;
    message += `\n\n_Track your progress at neuronerdsquiz.vercel.app_`;

    console.log('💬 Sending WhatsApp message to:', user.phoneNumber);
    const whatsappService = (await import('../services/whatsappService.js')).default;
    await whatsappService.sendMessage(user.phoneNumber, message);
    console.log('✅ Test reminder sent successfully');

    res.json({ success: true, message: 'Test reminder sent' });
  } catch (error) {
    console.error('❌ Test reminder error:', error);
    res.status(500).json({ error: 'Failed to send test reminder' });
  }
});




export default router;
