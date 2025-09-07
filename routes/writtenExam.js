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

// Submit written exam answers
router.post('/submit', sessionMiddleware, requireAuth, upload.array('answerImages', 10), async (req, res) => {
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

    // Check if user already submitted
    const existingSubmission = await WrittenSubmission.findOne({ examId, userId });
    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already submitted this exam' });
    }

    const user = await User.findById(userId);
    const answerImages = req.files.map(file => file.path);

    const submission = new WrittenSubmission({
      examId,
      userId,
      username: user.username,
      answerImages,
      totalMarks: exam.totalMarks
    });

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

export default router;