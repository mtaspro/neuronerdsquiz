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
    
    if (!lastHistoryDate || today !== lastHistoryDate) {
      progress.progressHistory.push({ totalProgress, beiProgress, scienceProgress });
    } else {
      progress.progressHistory[progress.progressHistory.length - 1] = { 
        date: new Date(), totalProgress, beiProgress, scienceProgress 
      };
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

    await progress.save();
    
    // Populate subjectId before sending response
    await progress.populate('completedChapters.subjectId');
    
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
    const progress = await UserProgress.findOne({ userId: req.user.userId }).populate('completedChapters.subjectId');
    const subjects = await ProgressSubject.find({ isActive: true });
    const exams = await ProgressExam.find({ isActive: true }).sort('date');
    
    if (!progress) return res.json({ insights: [] });

    const insights = [];
    const totalChapters = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const totalProgress = Math.round((progress.completedChapters.length / totalChapters) * 100);

    // Overall progress insight
    if (totalProgress >= 70) {
      insights.push({ type: 'success', text: `Amazing! You've completed ${totalProgress}% of your syllabus. Keep it up! 🎉` });
    } else if (totalProgress >= 40) {
      insights.push({ type: 'info', text: `You've completed ${totalProgress}% of your syllabus. Great progress! 📚` });
    } else {
      insights.push({ type: 'warning', text: `You've completed ${totalProgress}% of your syllabus. Time to accelerate! 🚀` });
    }

    // Subject-specific insights
    subjects.forEach(subject => {
      const completed = progress.completedChapters.filter(
        c => c.subjectId._id.toString() === subject._id.toString()
      ).length;
      const percentage = Math.round((completed / subject.chapters.length) * 100);
      
      if (percentage === 100) {
        insights.push({ type: 'success', text: `${subject.name} mastered! 100% complete! 🏆` });
      } else if (percentage < 30) {
        insights.push({ type: 'warning', text: `${subject.name} needs attention. Only ${percentage}% complete.` });
      }
    });

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

export default router;
