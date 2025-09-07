import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { sessionMiddleware, requireAuth } from '../middleware/sessionMiddleware.js';
import WrittenExam from '../models/WrittenExam.js';
import WrittenSubmission from '../models/WrittenSubmission.js';
import User from '../models/User.js';

// Configure multer with Cloudinary for marked images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'written-exams/marked',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    
    console.log('Grading submission:', submissionId, { marksObtained, examinerComments, status });
    
    const submission = await WrittenSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.marksObtained = parseInt(marksObtained) || 0;
    submission.examinerComments = examinerComments || '';
    submission.status = status;
    submission.gradedBy = req.user.userId;
    submission.gradedAt = new Date();
    
    // Add marked images if uploaded
    if (req.files && req.files.length > 0) {
      submission.markedImages = req.files.map(file => file.path);
      console.log('Added marked images:', submission.markedImages.length);
    }

    await submission.save();
    console.log('Submission graded successfully:', submissionId);
    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ error: 'Failed to grade submission', details: error.message });
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

// Delete written exam
router.delete('/exams/:examId', sessionMiddleware, requireAuth, requireExaminer, async (req, res) => {
  try {
    const exam = await WrittenExam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Check if user is creator or admin
    const user = await User.findById(req.user.userId);
    if (exam.createdBy.toString() !== req.user.userId && !user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ error: 'Only exam creator or admin can delete' });
    }
    
    await WrittenExam.findByIdAndDelete(req.params.examId);
    // Delete all related submissions
    await WrittenSubmission.deleteMany({ examId: req.params.examId });
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Get all exams for management
router.get('/exams', sessionMiddleware, requireAuth, requireExaminer, async (req, res) => {
  try {
    const exams = await WrittenExam.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
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