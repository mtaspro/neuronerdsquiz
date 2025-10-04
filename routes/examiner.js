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
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 20 // Max 20 files
  }
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

// Get all pending submissions for grading (with gender restrictions)
router.get('/submissions', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const { status = 'pending', override } = req.query;
    const examiner = await User.findById(req.user.userId);
    
    const submissions = await WrittenSubmission.find({ status })
      .populate('examId', 'title subject chapter totalMarks')
      .populate('userId', 'username email gender')
      .populate('gradedBy', 'username')
      .sort({ submittedAt: -1 });
    
    // Check if examiner can bypass gender restrictions
    const canBypass = examiner.canBypassGenderRestriction || examiner.isSuperAdmin;
    
    if (canBypass) {
      // Examiner with bypass permission can see all submissions
      return res.json({ submissions, bypassActive: true });
    }
    
    // Filter submissions based on gender restrictions
    const filteredSubmissions = submissions.filter(submission => {
      if (!submission.userId || !submission.userId.gender || !examiner.gender) {
        return true; // Allow if gender not set
      }
      return submission.userId.gender !== examiner.gender;
    });
    
    res.json({ submissions: filteredSubmissions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade a submission (with gender restrictions)
router.put('/grade/:submissionId', sessionMiddleware, requireAuth, requireExaminer, (req, res, next) => {
  // Set longer timeout for file uploads
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
}, upload.array('markedImages', 20), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, examinerComments, status = 'graded' } = req.body;
    
    console.log('Grading submission:', submissionId, { marksObtained, examinerComments, status });
    console.log('Files received:', req.files?.length || 0);
    
    const submission = await WrittenSubmission.findById(submissionId)
      .populate('userId', 'username email gender');
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Check gender restrictions with bypass capability
    const examiner = await User.findById(req.user.userId);
    
    if (submission.userId && submission.userId.gender && examiner.gender) {
      if (submission.userId.gender === examiner.gender) {
        // Check if examiner can bypass gender restrictions
        const canBypass = examiner.canBypassGenderRestriction || examiner.isSuperAdmin;
        
        if (!canBypass) {
          return res.status(403).json({ 
            error: 'Gender restriction: You can only grade students of opposite gender. Contact SuperAdmin for bypass permission.'
          });
        }
      }
    }

    // Update submission fields
    const updateData = {
      marksObtained: parseInt(marksObtained) || 0,
      examinerComments: examinerComments || '',
      status: status,
      gradedBy: req.user.userId,
      gradedAt: new Date()
    };
    
    // Add marked images if uploaded
    if (req.files && req.files.length > 0) {
      const newMarkedImages = req.files.map(file => file.path);
      updateData.markedImages = [...(submission.markedImages || []), ...newMarkedImages];
      console.log('Added marked images:', newMarkedImages.length);
    }

    const updatedSubmission = await WrittenSubmission.findByIdAndUpdate(
      submissionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('examId', 'title subject chapter totalMarks')
     .populate('userId', 'username email')
     .populate('gradedBy', 'username');

    console.log('Submission graded successfully:', submissionId);
    res.json({ message: 'Submission graded successfully', submission: updatedSubmission });
  } catch (error) {
    console.error('Error grading submission:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid data provided', details: error.message });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum 50MB per file.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ error: 'Too many files. Maximum 20 files allowed.' });
    }
    
    res.status(500).json({ error: 'Failed to grade submission', details: error.message });
  }
});

// Create new written exam (admin/examiner only)
router.post('/exams', sessionMiddleware, requireAuth, requireExaminer, upload.array('questionPapers', 10), async (req, res) => {
  try {
    const { title, description, subject, chapter, totalMarks, timeLimit, expireDate } = req.body;
    
    let questionPaperUrls = [];
    
    // Upload question papers to Cloudinary if provided
    if (req.files && req.files.length > 0) {
      questionPaperUrls = req.files.map(file => file.path);
    }
    
    const exam = new WrittenExam({
      title,
      description,
      subject,
      chapter,
      totalMarks: parseInt(totalMarks),
      timeLimit: parseInt(timeLimit),
      expireDate: new Date(expireDate),
      createdBy: req.user.userId,
      questionPapers: questionPaperUrls
    });
    
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
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
router.get('/exams', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const exams = await WrittenExam.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get exam participation report
router.get('/exams/:examId/report', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Get all users (including admins)
    const allUsers = await User.find({}, 'username email isAdmin isSuperAdmin isExaminer');
    
    // Get submissions for this exam
    const submissions = await WrittenSubmission.find({ examId })
      .populate('userId', 'username email')
      .sort({ submittedAt: -1 });
    
    // Get exam details for time limit check
    const exam = await WrittenExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Create participation report
    const report = allUsers.map(user => {
      const submission = submissions.find(s => s.userId && s.userId._id.toString() === user._id.toString());
      
      if (submission) {
        let actualStatus = submission.status;
        
        // Calculate time remaining for started exams
        let timeRemaining = null;
        
        // If submitted, show as pending/graded, not started
        if (submission.submittedAt) {
          actualStatus = submission.status; // Keep original status (pending/graded)
        } else if (submission.status === 'started' && submission.examStartTime) {
          const startTime = new Date(submission.examStartTime);
          const timeLimit = exam.timeLimit * 60 * 1000; // Convert minutes to milliseconds
          const now = new Date();
          const elapsed = now - startTime;
          
          console.log(`Debug - User: ${user.username}, Started: ${startTime}, Now: ${now}, Elapsed: ${elapsed}ms, Limit: ${timeLimit}ms`);
          
          if (elapsed > timeLimit) {
            actualStatus = 'time_expired';
            timeRemaining = 'Expired';
            
            // Mark for database update (will be done after map)
            submission._needsExpiredUpdate = true;
          } else {
            const remaining = timeLimit - elapsed;
            const minutes = Math.floor(remaining / (60 * 1000));
            const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
            timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }
        
        return {
          userId: user._id,
          username: user.username,
          email: user.email,
          status: actualStatus,
          examStarted: submission.examStartTime ? 'Yes' : 'No',
          submitted: submission.submittedAt ? 'Yes' : 'No',
          submittedAt: submission.submittedAt,
          marksObtained: submission.marksObtained || 0,
          totalMarks: submission.totalMarks || 0,
          examinerComments: submission.examinerComments || '',
          timeRemaining: timeRemaining,
          examStartTime: submission.examStartTime
        };
      } else {
        return {
          userId: user._id,
          username: user.username,
          email: user.email,
          status: 'not_started',
          examStarted: 'No',
          submitted: 'No',
          submittedAt: null,
          marksObtained: 0,
          totalMarks: 0,
          examinerComments: '',
          timeRemaining: null,
          examStartTime: null
        };
      }
    });
    
    // Update expired submissions in database
    const expiredSubmissions = submissions.filter(s => s._needsExpiredUpdate);
    if (expiredSubmissions.length > 0) {
      try {
        await Promise.all(expiredSubmissions.map(s => 
          WrittenSubmission.findByIdAndUpdate(s._id, { status: 'time_expired' })
        ));
        console.log(`Updated ${expiredSubmissions.length} submissions to time_expired`);
      } catch (updateError) {
        console.error('Failed to update expired statuses:', updateError);
      }
    }
    
    res.json(report);
  } catch (error) {
    console.error('Exam report error:', error);
    res.status(500).json({ error: 'Failed to fetch exam report' });
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

// Toggle gender restriction bypass (SuperAdmin only)
router.put('/toggle-bypass/:userId', sessionMiddleware, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.isSuperAdmin) {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newBypassStatus = !targetUser.canBypassGenderRestriction;
    await User.findByIdAndUpdate(req.params.userId, { 
      canBypassGenderRestriction: newBypassStatus 
    });
    
    res.json({ 
      message: `Gender restriction bypass ${newBypassStatus ? 'enabled' : 'disabled'} for ${targetUser.username}`,
      canBypassGenderRestriction: newBypassStatus
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle bypass permission' });
  }
});

export default router;