import mongoose from 'mongoose';
import crypto from 'crypto';
import { isIP } from 'net';

const adminRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['USER_DELETION', 'USER_SCORE_RESET', 'LEADERBOARD_RESET', 'QUIZ_LEADERBOARD_RESET', 'BATTLE_LEADERBOARD_RESET'],
    required: true,
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requestedByUsername: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  // For user deletion requests
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetUsername: {
    type: String,
    trim: true,
    maxlength: [50, 'Username cannot exceed 50 characters']
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  // SuperAdmin response
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },
  // Additional security and tracking fields
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
    index: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Auto-expire requests after 30 days if not reviewed
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    },
    index: true // Regular index, not TTL - preserves approved/rejected requests
  },
  // Enhanced audit trail
  createdByIp: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return isIP(v) !== 0; // Node.js built-in IP validation
      },
      message: 'Invalid IP address format'
    }
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  // Request deduplication hash
  requestHash: {
    type: String,
    unique: true,
    required: true,
    index: true // Add index for performance
  },
  requestCount: {
    type: Number,
    default: 1,
    min: [1, 'Request count must be positive']
  },
  // Additional data for specific request types
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        if (!v) return true;
        if (v === null || Array.isArray(v)) return false;
        try {
          const jsonStr = JSON.stringify(v);
          return jsonStr.length <= 2000;
        } catch (e) {
          return false; // Handles circular references
        }
      },
      message: 'Additional data must be a valid object and cannot exceed 2KB'
    }
  }
}, {
  timestamps: true,
  versionKey: true
});

// Optimized compound indexes
adminRequestSchema.index({ status: 1, expiresAt: 1, createdAt: -1 }); // Optimized pending requests
adminRequestSchema.index({ requestedBy: 1, createdAt: -1 }); // Requests by user
adminRequestSchema.index({ type: 1, status: 1 }); // Requests by type and status
adminRequestSchema.index({ targetUserId: 1 }, { sparse: true }); // User-specific requests
adminRequestSchema.index({ priority: -1, createdAt: -1 }); // Priority-based queries
adminRequestSchema.index({ createdByIp: 1, createdAt: -1 }); // IP-based rate limiting

// Pre-save middleware for validation and auto-population
adminRequestSchema.pre('save', function(next) {
  // Validate ObjectId formats
  if (this.targetUserId && !mongoose.Types.ObjectId.isValid(this.targetUserId)) {
    return next(new Error('Invalid targetUserId format'));
  }
  if (this.reviewedBy && !mongoose.Types.ObjectId.isValid(this.reviewedBy)) {
    return next(new Error('Invalid reviewedBy format'));
  }

  // Generate request hash for deduplication if not provided (include timestamp to prevent collisions)
  if (!this.requestHash) {
    const timestamp = this.createdAt || new Date();
    const hashData = `${this.type}-${this.requestedBy}-${this.targetUserId || 'global'}-${this.reason}-${timestamp.getTime()}`;
    this.requestHash = crypto.createHash('sha256').update(hashData).digest('hex');
  }
  
  // Ensure reviewedBy cannot be the same as requestedBy (prevent self-approval)
  if (this.reviewedBy && this.requestedBy && this.reviewedBy.equals(this.requestedBy)) {
    return next(new Error('Admin cannot review their own request'));
  }
  
  // Auto-set reviewedAt and validate reviewer when status changes from PENDING
  if (this.isModified('status') && this.status !== 'PENDING') {
    if (!this.reviewedAt) {
      this.reviewedAt = new Date();
    }
    if (!this.reviewedBy) {
      return next(new Error('ReviewedBy is required when changing status from PENDING'));
    }
  }
  
  // Prevent approving expired requests
  if (this.status === 'APPROVED' && this.expiresAt && this.expiresAt < new Date()) {
    return next(new Error('Cannot approve expired requests'));
  }
  
  // Application-level validation for target user requirements
  const userSpecificTypes = ['USER_DELETION', 'USER_SCORE_RESET'];
  if (userSpecificTypes.includes(this.type)) {
    if (!this.targetUserId) {
      return next(new Error('Target user is required for user-specific requests'));
    }
    if (!this.targetUsername) {
      return next(new Error('Target username is required for user-specific requests'));
    }
  }
  
  next();
});

// Post-save middleware for logging (conditional to prevent memory leaks)
adminRequestSchema.post('save', function(doc) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Admin request ${doc._id} saved with status: ${doc.status}`);
  }
});

// Instance methods
adminRequestSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

adminRequestSchema.methods.canBeReviewed = function() {
  return this.status === 'PENDING' && !this.isExpired();
};

// Fixed async methods with proper error handling
adminRequestSchema.methods.approve = async function(reviewerId, notes) {
  if (!this.canBeReviewed()) {
    throw new Error('Request cannot be approved - either not pending or expired');
  }
  
  this.status = 'APPROVED';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  
  try {
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to approve request: ${error.message}`);
  }
};

adminRequestSchema.methods.reject = async function(reviewerId, notes) {
  if (!this.canBeReviewed()) {
    throw new Error('Request cannot be rejected - either not pending or expired');
  }
  
  this.status = 'REJECTED';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  if (notes) this.reviewNotes = notes;
  
  try {
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to reject request: ${error.message}`);
  }
};

// Enhanced static methods with error handling
adminRequestSchema.statics.findPendingRequests = function(limit = 50) {
  try {
    return this.find({ 
      status: 'PENDING',
      expiresAt: { $gt: new Date() }
    })
    .populate('requestedBy', 'username email')
    .populate('targetUserId', 'username email')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit);
  } catch (error) {
    throw new Error(`Failed to find pending requests: ${error.message}`);
  }
};

adminRequestSchema.statics.findByRequester = function(userId, limit = 50) {
  try {
    return this.find({ requestedBy: userId })
      .populate('targetUserId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Failed to find requests by requester: ${error.message}`);
  }
};

adminRequestSchema.statics.findByType = function(type, limit = 50) {
  try {
    return this.find({ type })
      .populate('requestedBy', 'username email')
      .populate('targetUserId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    throw new Error(`Failed to find requests by type: ${error.message}`);
  }
};

adminRequestSchema.statics.findExpiredRequests = function() {
  try {
    return this.find({
      status: 'PENDING',
      expiresAt: { $lt: new Date() }
    });
  } catch (error) {
    throw new Error(`Failed to find expired requests: ${error.message}`);
  }
};

adminRequestSchema.statics.getRequestStats = function() {
  try {
    return this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          stats: {
            $push: {
              status: '$_id',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);
  } catch (error) {
    throw new Error(`Failed to get request stats: ${error.message}`);
  }
};

// Improved rate limiting with separate queries for better performance
adminRequestSchema.statics.checkRateLimit = async function(userId, ipAddress, timeWindow = 3600000) {
  try {
    const since = new Date(Date.now() - timeWindow); // 1 hour ago
    
    const [userCount, ipCount] = await Promise.all([
      this.countDocuments({ requestedBy: userId, createdAt: { $gte: since } }),
      this.countDocuments({ createdByIp: ipAddress, createdAt: { $gte: since } })
    ]);
    
    return { userCount, ipCount, total: Math.max(userCount, ipCount) };
  } catch (error) {
    throw new Error(`Failed to check rate limit: ${error.message}`);
  }
};

// Helper method to clean up expired requests (manual cleanup since we removed TTL)
adminRequestSchema.statics.cleanupExpiredRequests = async function() {
  try {
    const result = await this.updateMany(
      { 
        status: 'PENDING', 
        expiresAt: { $lt: new Date() } 
      },
      { 
        $set: { status: 'EXPIRED' } 
      }
    );
    return result;
  } catch (error) {
    throw new Error(`Failed to cleanup expired requests: ${error.message}`);
  }
};

export default mongoose.model('AdminRequest', adminRequestSchema);
