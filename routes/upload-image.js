import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinaryConfig.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image endpoint
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'neuronerds-chat');
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image' 
    });
  }
});

export { router };