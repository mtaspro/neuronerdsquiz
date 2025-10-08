import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { sessionMiddleware, requireAuth } from '../middleware/sessionMiddleware.js';
import WrittenExam from '../models/WrittenExam.js';
import WrittenSubmission from '../models/WrittenSubmission.js';
import User from '../models/User.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'written-exams',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Get all written exams
router.get('/exams', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const exams = await WrittenExam.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch written exams' });
  }
});

// Start written exam
router.post('/start', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.userId;
    
    const exam = await WrittenExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Check if exam is expired
    if (new Date() > new Date(exam.expireDate)) {
      return res.status(400).json({ error: 'Exam has expired' });
    }
    
    // Check if user already has a submission for this exam
    let submission = await WrittenSubmission.findOne({ examId, userId });
    
    if (submission) {
      // Return existing submission
      return res.json({ submission });
    }
    
    const user = await User.findById(userId);
    
    // Create new submission with started status
    submission = new WrittenSubmission({
      examId,
      userId,
      username: user.username,
      totalMarks: exam.totalMarks,
      status: 'started',
      examStartTime: new Date()
    });
    
    await submission.save();
    res.json({ submission });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Submit written exam answers
router.post('/submit', sessionMiddleware, requireAuth, upload.array('answerImages', 50), async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.userId;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one answer image is required' });
    }

    const exam = await WrittenExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Find existing submission
    const submission = await WrittenSubmission.findOne({ examId, userId });
    if (!submission) {
      return res.status(400).json({ error: 'Exam not started' });
    }
    
    if (submission.status !== 'started') {
      return res.status(400).json({ error: 'Exam already submitted' });
    }
    
    const answerImages = req.files.map(file => file.path);
    
    submission.answerImages = answerImages;
    submission.status = 'pending';

    await submission.save();
    res.json({ message: 'Answer submitted successfully', submissionId: submission._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get user's submissions
router.get('/my-submissions', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const submissions = await WrittenSubmission.find({ userId: req.user.userId })
      .populate('examId', 'title subject chapter totalMarks')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get written exam leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await WrittenSubmission.aggregate([
      { $match: { status: 'graded', submittedAt: { $exists: true }, examStartTime: { $exists: true } } },
      {
        $addFields: {
          submissionTime: {
            $divide: [
              { $subtract: ['$submittedAt', '$examStartTime'] },
              1000 // Convert to seconds
            ]
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          totalMarks: { $sum: '$marksObtained' },
          examCount: { $sum: 1 },
          averageMarks: { $avg: '$marksObtained' },
          avgSubmissionTime: { $avg: '$submissionTime' },
          minSubmissionTime: { $min: '$submissionTime' }
        }
      },
      { 
        $sort: { 
          totalMarks: -1, 
          avgSubmissionTime: 1 // Faster average time wins for same marks
        } 
      },
      { $limit: 50 }
    ]);
    
    // Round submission times for display
    const formattedLeaderboard = leaderboard.map(entry => ({
      ...entry,
      avgSubmissionTime: Math.round(entry.avgSubmissionTime || 0),
      minSubmissionTime: Math.round(entry.minSubmissionTime || 0)
    }));
    
    res.json(formattedLeaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;