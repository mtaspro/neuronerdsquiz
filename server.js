import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';

import leaderboardRouter from './routes/leaderboard.js';
import authRouter from './routes/auth.js';
import quizRouter from './routes/quiz.js';
import adminRouter from './routes/admin.js';
import superAdminRouter from './routes/superadmin.js';
import badgeRouter from './routes/badges.js';
import battleRouter from './routes/battle.js';
import { router as latexRouter } from './routes/latex.js';
import { router as aiChatRouter } from './routes/ai-chat.js';
import { router as webSearchRouter } from './routes/web-search.js';
import { router as imageGenRouter } from './routes/image-generation.js';
import { router as uploadImageRouter } from './routes/upload-image.js';
import themeRouter from './routes/theme.js';
import BattleService from './services/battleService.js';
import BadgeService from './services/badgeService.js';
import UserScore from './models/UserScore.js';

console.log('Auth router imported:', !!authRouter);
console.log('Auth router type:', typeof authRouter);

dotenv.config();

const app = express();
const server = createServer(app);

// CORS origins configuration - Allow all Vercel and localhost origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://neuronerdsquiz.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

// Enhanced CORS configuration with explicit headers
const corsOptions = {
  origin: (origin, callback) => {
    console.log('🌐 CORS request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin found in allowed list:', origin);
      return callback(null, true);
    }
    
    // Allow any Vercel app domain
    if (origin.includes('.vercel.app')) {
      console.log('✅ Allowing Vercel domain:', origin);
      return callback(null, true);
    }
    
    // Allow localhost with any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ Allowing localhost:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With", 
    "Content-Type", 
    "Accept", 
    "Authorization",
    "Cache-Control",
    "X-HTTP-Method-Override"
  ],
  exposedHeaders: ["Authorization"],
  credentials: false,
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
};

console.log('🌐 CORS configuration:', {
  allowedOrigins,
  dynamicVercelSupport: true,
  localhostSupport: true
});

const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors(corsOptions));

// Additional manual CORS handling for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🔍 Manual CORS check for ${req.method} ${req.path} from origin: ${origin}`);
  
  // Set CORS headers for all requests
  if (origin) {
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('.vercel.app') || 
                     origin.includes('localhost') || 
                     origin.includes('127.0.0.1');
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`✅ Manual CORS: Allowing origin ${origin}`);
    } else {
      console.log(`❌ Manual CORS: Blocking origin ${origin}`);
    }
  } else {
    // Allow requests with no origin
    res.header('Access-Control-Allow-Origin', '*');
    console.log(`✅ Manual CORS: Allowing request with no origin`);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-HTTP-Method-Override');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ Handling OPTIONS preflight request for ${req.path}`);
    res.status(200).end();
    return;
  }
  
  next();
});

// Serve uploaded files with fallback
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(process.cwd(), 'uploads', req.path);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    express.static('uploads')(req, res, next);
  } else {
    // File doesn't exist, redirect to default avatar
    const filename = req.path.split('/').pop();
    if (filename && filename.startsWith('profile-')) {
      // Extract username from request or use generic
      const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=random';
      res.redirect(defaultAvatar);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected!');
    // Initialize badges after MongoDB connection
    initializeBadges();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Battle service instance
const battleService = new BattleService();

// Badge service instance
const badgeService = new BadgeService();

// Initialize badges
async function initializeBadges() {
  try {
    console.log('🏆 Initializing badge system...');
    await badgeService.initializeBadges();
    console.log('✅ Badge system initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing badge system:', error);
  }
}

// Add balanced bonus based on general quiz performance
async function addBalancedBonus(userId, username) {
  try {
    const generalScore = await UserScore.findOne({ userId, type: 'general' });
    if (generalScore) {
      // Add 1% of general score as battle bonus (max 5 points)
      const bonus = Math.min(5, Math.floor(generalScore.score * 0.01));
      
      const battleScore = await UserScore.findOne({ userId, type: 'battle' });
      if (battleScore) {
        battleScore.score += bonus;
        await battleScore.save();
        console.log(`💰 Added ${bonus} balanced bonus to ${username}`);
      }
    }
  } catch (error) {
    console.error('Error adding balanced bonus:', error);
  }
}

// Function to save battle results to leaderboard
async function saveBattleResultsToLeaderboard(battleResults) {
  try {
    console.log('💾 Saving battle results to leaderboard...');
    
    for (const result of battleResults.results) {
      try {
        // Find existing battle score or create new one
        const existingScore = await UserScore.findOne({ 
          userId: result.userId, 
          type: 'battle' 
        });
        
        if (existingScore) {
          // Update if new score is higher
          if (result.score > existingScore.score) {
            existingScore.score = result.score;
            await existingScore.save();
            console.log(`📈 Updated ${result.username} battle score: ${result.score}`);
          }
        } else {
          // Create new battle leaderboard entry
          const newScore = new UserScore({
            userId: result.userId,
            username: result.username,
            score: result.score,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.username)}&background=random`,
            type: 'battle'
          });
          await newScore.save();
          console.log(`🆕 Added ${result.username} to battle leaderboard: ${result.score}`);
        }

        // Update battle stats for badge calculation
        await badgeService.updateBattleStats(result.userId, {
          won: result.rank === 1,
          score: result.score,
          timeSpent: result.totalTime
        });
        
        // Add balanced bonus from general quiz score
        await addBalancedBonus(result.userId, result.username);
        
      } catch (userError) {
        console.error(`❌ Error saving score for ${result.username}:`, userError);
      }
    }
    
    console.log('✅ Battle results saved to leaderboard');
  } catch (error) {
    console.error('❌ Error saving battle results:', error);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id} from ${socket.handshake.address}`);
  console.log(`📊 Total connected clients: ${io.engine.clientsCount}`);

  // Join battle room
  socket.on('joinBattleRoom', ({ roomId, userId, username }) => {
    console.log(`User ${username} (${userId}) joining room ${roomId}`);
    
    try {
      const room = battleService.addUserToRoom(roomId, userId, username, socket.id);
      socket.join(roomId);
      
      // Notify all users in the room
      io.to(roomId).emit('userJoined', {
        userId,
        username,
        totalUsers: room.users.size
      });

      // Send current room state to the joining user
      socket.emit('roomJoined', {
        roomId,
        users: Array.from(room.users.values()).map(user => ({
          id: user.id,
          username: user.username,
          isReady: user.isReady
        })),
        status: room.status
      });

      console.log(`User ${username} joined room ${roomId}. Total users: ${room.users.size}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start battle
  socket.on('startBattle', ({ roomId, questions }) => {
    try {
      const room = battleService.startBattle(roomId, questions, socket.id);
      
      // Notify all users that battle is starting
      io.to(roomId).emit('battleStarted', {
        questions: questions,
        startTime: room.startTime,
        totalQuestions: questions.length
      });

      console.log(`Battle started in room ${roomId} with ${questions.length} questions`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Submit answer
  socket.on('answerQuestion', ({ roomId, userId, questionIndex, answer, isCorrect, timeSpent }) => {
    try {
      const result = battleService.submitAnswer(roomId, userId, questionIndex, answer, isCorrect, timeSpent);
      
      // Broadcast progress update to all users in the room
      io.to(roomId).emit('updateProgress', {
        userId,
        username: result.user.username,
        currentQuestion: result.user.currentQuestion,
        score: result.user.score,
        totalQuestions: battleService.getRoom(roomId).questions.length
      });

      // Check if user has finished all questions
      if (result.hasFinished) {
        io.to(roomId).emit('userFinished', {
          userId,
          username: result.user.username,
          finalScore: result.user.score,
          totalTime: new Date() - battleService.getRoom(roomId).startTime
        });
      }

      // Check if all users have finished
      if (result.allFinished) {
        const battleResults = battleService.endBattle(roomId);
        
        // Save battle results to leaderboard and update badges
        saveBattleResultsToLeaderboard(battleResults);
        
        io.to(roomId).emit('battleEnded', battleResults);
      }

      console.log(`User ${result.user.username} answered question ${questionIndex + 1} in room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // User ready status
  socket.on('setReady', ({ roomId, userId, isReady }) => {
    const user = battleService.setUserReady(roomId, userId, isReady);
    if (user) {
      io.to(roomId).emit('userReadyStatus', {
        userId,
        username: user.username,
        isReady
      });
    }
  });

  // Chat message
  socket.on('sendChatMessage', ({ roomId, username, message }) => {
    if (message && message.trim() && roomId && username) {
      io.to(roomId).emit('chatMessage', {
        username,
        message: message.trim(),
        timestamp: new Date()
      });
    }
  });

  // Leave room
  socket.on('leaveRoom', ({ roomId, userId }) => {
    const room = battleService.removeUserFromRoom(roomId, userId);
    if (room) {
      socket.leave(roomId);
      io.to(roomId).emit('userLeft', {
        userId,
        username: room.users.get(userId)?.username || 'Unknown',
        totalUsers: room.users.size
      });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and remove user from all rooms
    const userInfo = battleService.getUserBySocketId(socket.id);
    if (userInfo) {
      const { user, room } = userInfo;
      const updatedRoom = battleService.removeUserFromRoom(room.id, user.id);
      
      if (updatedRoom) {
        io.to(room.id).emit('userLeft', {
          userId: user.id,
          username: user.username,
          totalUsers: updatedRoom.users.size
        });
      }
    }
  });
});

// Cleanup inactive rooms every 30 minutes
setInterval(() => {
  battleService.cleanupInactiveRooms();
}, 30 * 60 * 1000);

// Make io available to routes
app.set('io', io);

// Mount the routers with /api prefix
console.log('Mounting leaderboard router...');
app.use('/api', leaderboardRouter);
console.log('Mounting auth router...');
app.use('/api/auth', authRouter);
console.log('Mounting quiz router...');
app.use('/api/quizzes', quizRouter);
console.log('Mounting admin router...');
app.use('/api/admin', adminRouter);
console.log('Mounting superadmin router...');
app.use('/api/superadmin', superAdminRouter);
console.log('Mounting badge router...');
app.use('/api/badges', badgeRouter);
console.log('Mounting battle router...');
app.use('/api/battle', battleRouter);
console.log('Mounting latex router...');
app.use('/api/latex', latexRouter);
console.log('Mounting AI chat router...');
app.use('/api/ai-chat', aiChatRouter);
console.log('Mounting web search router...');
app.use('/api/web-search', webSearchRouter);
console.log('Mounting image generation router...');
app.use('/api/generate-image', imageGenRouter);
console.log('Mounting image upload router...');
app.use('/api/upload-image', uploadImageRouter);
console.log('Mounting theme router...');
app.use('/api/theme', themeRouter);
console.log('Mounting events router...');
app.use('/api/events', (await import('./routes/events.js')).default);
console.log('All routers mounted successfully');

// Test route for API connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// CORS test route
app.get('/api/cors-test', (req, res) => {
  const origin = req.headers.origin;
  console.log('CORS test route accessed from origin:', origin);
  res.json({ 
    message: 'CORS test successful!',
    origin: origin,
    timestamp: new Date().toISOString()
  });
});

// Simple POST test route for CORS
app.post('/api/cors-test', (req, res) => {
  const origin = req.headers.origin;
  console.log('CORS POST test route accessed from origin:', origin);
  console.log('Request body:', req.body);
  res.json({ 
    message: 'CORS POST test successful!',
    origin: origin,
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Socket.IO health check
app.get('/socket.io/health', (req, res) => {
  res.json({ 
    message: 'Socket.IO server is running',
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount || 0
  });
});

// Battle rooms status endpoint
app.get('/api/battle-rooms', (req, res) => {
  const roomsInfo = battleService.getAllRoomsInfo();
  res.json(roomsInfo);
});

// Get specific room status
app.get('/api/battle-rooms/:roomId', (req, res) => {
  const roomStatus = battleService.getRoomStatus(req.params.roomId);
  if (roomStatus) {
    res.json(roomStatus);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

// Example route
app.get('/', (req, res) => {
  res.send('Express + MongoDB Atlas backend is running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));