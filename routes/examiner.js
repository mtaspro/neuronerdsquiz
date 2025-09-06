import express from 'express';
import multer from 'multer';
import path from 'path';
import { sessionMiddleware, requireAuth } from '../middleware/sessionMiddleware.js';
import WrittenExam from '../models/WrittenExam.js';
import WrittenSubmission from '../models/WrittenSubmission.js';
import User from '../models/User.js';

// Configure multer for marked images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/written-exams/');
  },
  filename: (req, file, cb) => {
    cb(null, `marked-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

const router = express.Router();

// Middleware to check if user is examiner
const requireExaminer = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isExaminer && !user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ error: 'Access denied. Examiner privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify examiner status' });
  }
};

// Get all pending submissions for grading
router.get('/submissions', sessionMiddleware, requireAuth, requireExaminer, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const submissions = await WrittenSubmission.find({ status })
      .populate('examId', 'title subject chapter totalMarks')
      .populate('userId', 'username email')
      .populate('gradedBy', 'username')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade a submission
router.put('/grade/:submissionId', sessionMiddleware, requireAuth, requireExaminer, upload.array('markedImages', 10), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, examinerComments, status = 'graded' } = req.body;
    
    const submission = await WrittenSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.marksObtained = marksObtained;
    submission.examinerComments = examinerComments;
    submission.status = status;
    submission.gradedBy = req.user.userId;
    submission.gradedAt = new Date();
    
    // Add marked images if uploaded
    if (req.files && req.files.length > 0) {
      submission.markedImages = req.files.map(file => `/uploads/written-exams/${file.filename}`);
    }

    await submission.save();
    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Create new written exam (admin/examiner only)
router.post('/exams', sessionMiddleware, requireAuth, requireExaminer, async (req, res) => {
  try {
    const exam = new WrittenExam({
      ...req.body,
      createdBy: req.user.userId
    });
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// Get written exam leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await WrittenSubmission.aggregate([
      { $match: { status: 'graded' } },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          totalMarks: { $sum: '$marksObtained' },
          examCount: { $sum: 1 },
          averageMarks: { $avg: '$marksObtained' }
        }
      },
      { $sort: { totalMarks: -1 } },
      { $limit: 50 }
    ]);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Promote user to examiner (admin only)
router.put('/promote/:userId', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    await User.findByIdAndUpdate(req.params.userId, { isExaminer: true });
    res.json({ message: 'User promoted to examiner' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

export default router;