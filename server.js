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
import Exam from './models/Exam.js';
import badgeRouter from './routes/badges.js';
import battleRouter from './routes/battle.js';
import { router as latexRouter } from './routes/latex.js';
import { router as aiChatRouter } from './routes/ai-chat.js';
import { router as webSearchRouter } from './routes/web-search.js';

import { router as uploadImageRouter } from './routes/upload-image.js';
import { router as visionRouter } from './routes/vision.js';
import imageGenerationRouter from './routes/image-generation.js';
import themeRouter from './routes/theme.js';
import whatsappRouter from './routes/whatsapp.js';
import userRouter from './routes/user.js';
import maintenanceRouter from './routes/maintenance.js';
import shareRouter from './routes/share.js';
import writtenExamRouter from './routes/writtenExam.js';
import examinerRouter from './routes/examiner.js';
import messengerRouter from './routes/messenger.js';
import notepadRouter from './routes/notepad.js';
import BattleService from './services/battleService.js';
import BadgeService from './services/badgeService.js';
import whatsappService from './services/whatsappService.js';
import DailyCalendarScheduler from './services/dailyCalendarScheduler.js';
import battleReminderService from './services/battleReminderService.js';
import { startProgressReminderService } from './services/progressReminderService.js';
import progressRouter from './routes/progress.js';
import WhatsAppSettings from './models/WhatsAppSettings.js';
import UserScore from './models/UserScore.js';
import secretChatRouter from './routes/secret-chat.js';

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
  "https://neuronerds.eu.cc",
  "https://neuronerdsquiz.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean);

// Enhanced CORS configuration with explicit headers
const corsOptions = {
  origin: (origin, callback) => {
    console.log('🌐 CORS request from origin:', encodeURIComponent(origin || 'null'));
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin found in allowed list:', encodeURIComponent(origin));
      return callback(null, true);
    }
    
    // Allow any Vercel app domain
    if (origin.includes('.vercel.app')) {
      console.log('✅ Allowing Vercel domain:', encodeURIComponent(origin));
      return callback(null, true);
    }
    
    // Allow localhost with any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ Allowing localhost:', encodeURIComponent(origin));
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', encodeURIComponent(origin));
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

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors(corsOptions));

// Additional manual CORS handling for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`🔍 Manual CORS check for ${req.method} ${req.path} from origin: ${encodeURIComponent(origin || 'null')}`);
  
  // Set CORS headers for all requests
  if (origin) {
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.includes('.vercel.app') || 
                     origin.includes('neuronerds.eu.cc') ||
                     origin.includes('localhost') || 
                     origin.includes('127.0.0.1');
    
    if (isAllowed) {
      res.header('Access-Control-Allow-Origin', origin);
      console.log(`✅ Manual CORS: Allowing origin ${encodeURIComponent(origin)}`);
    } else {
      console.log(`❌ Manual CORS: Blocking origin ${encodeURIComponent(origin)}`);
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

// Serve uploaded files with fallback (skip written exam files as they use Cloudinary)
app.use('/uploads', (req, res, next) => {
  // Skip written exam files - they're on Cloudinary
  if (req.path.includes('written-exams') || req.path.includes('written-answers')) {
    return res.status(404).json({ error: 'Written exam files are hosted on Cloudinary' });
  }
  
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

// Serve ads.txt for Google AdSense
app.get('/ads.txt', (req, res) => {
  const adsPath = path.join(process.cwd(), 'public', 'ads.txt');
  if (fs.existsSync(adsPath)) {
    res.type('text/plain');
    res.sendFile(adsPath);
  } else {
    res.status(404).send('ads.txt not found');
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
    // Initialize WhatsApp service
    whatsappService.initialize();
    // Start daily calendar scheduler
    dailyCalendarScheduler.start();
    // Start battle reminder service
    battleReminderService.start();
    // Start progress reminder service
    startProgressReminderService();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Battle service instance
const battleService = new BattleService();

// Badge service instance
const badgeService = new BadgeService();

// Daily calendar scheduler instance
const dailyCalendarScheduler = new DailyCalendarScheduler();

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

// Send battle end notification with leaderboard
async function sendBattleEndNotification(roomId, battleResults) {
  try {
    const setting = await WhatsAppSettings.findOne({ settingKey: 'battleNotificationGroup' });
    if (setting?.settingValue && battleResults?.results) {
      let message = `🏁 *BATTLE ENDED!* 🏁\n\nRoom: ${roomId}\n\n🏆 *COMPLETE LEADERBOARD:*\n`;
      
      // Show all players with detailed stats
      battleResults.results.forEach((result, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const correctAnswers = result.correctAnswers || 0;
        const totalQuestions = result.totalQuestions || 0;
        const submissionTime = result.totalTime ? formatTimeForWhatsApp(result.totalTime) : 'N/A';
        
        message += `${medal} *${result.username}*\n`;
        message += `   💯 ${result.score} pts (${correctAnswers}/${totalQuestions})\n`;
        message += `   ⏱️ ${submissionTime}\n\n`;
      });
      
      message += `🎮 Total Players: ${battleResults.results.length}`;
      
      await whatsappService.sendGroupMessage(setting.settingValue, message);
    }
  } catch (error) {
    console.error('Failed to send battle end notification:', error);
  }
}

// Helper function to format time for WhatsApp
function formatTimeForWhatsApp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
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
      
      const user = room.users.get(userId);
      const isRejoining = user && (user.currentQuestion > 0 || room.status === 'active');
      
      // Only notify about new joins, not rejoins
      if (!isRejoining) {
        io.to(roomId).emit('userJoined', {
          userId,
          username,
          totalUsers: room.users.size
        });
      } else {
        // Notify about reconnection
        io.to(roomId).emit('userReconnected', {
          userId,
          username,
          currentQuestion: user.currentQuestion,
          score: user.score
        });
      }

      // Send current room state to the joining user
      const roomState = {
        roomId,
        users: Array.from(room.users.values()).map(user => ({
          id: user.id,
          username: user.username,
          isReady: user.isReady,
          currentQuestion: user.currentQuestion || 0,
          score: user.score || 0,
          disconnected: user.disconnected || false
        })),
        status: room.status,
        creatorId: room.creatorId,
        isRejoin: isRejoining
      };
      
      // If battle is active, include questions and current state
      if (room.status === 'active') {
        roomState.questions = room.questions;
        roomState.startTime = room.startTime;
      }
      
      socket.emit('roomJoined', roomState);

      console.log(`User ${username} ${isRejoining ? 'rejoined' : 'joined'} room ${roomId}. Total users: ${room.users.size}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Start battle
  socket.on('startBattle', ({ roomId, questions, creatorUserId }) => {
    try {
      const room = battleService.startBattle(roomId, questions, creatorUserId);
      
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

  // Report inappropriate question
  socket.on('reportInappropriate', ({ roomId, userId, questionIndex, questionId, chapterName }) => {
    try {
      const result = battleService.reportInappropriateQuestion(roomId, userId, questionIndex, questionId);
      console.log(`User ${result.username} reported question ${questionIndex + 1} as inappropriate in room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Submit answer
  socket.on('answerQuestion', async ({ roomId, userId, questionIndex, answer, isCorrect, timeSpent, chapterName, lifelineUsed }) => {
    try {
      // Get chapter config for negative scoring
      let chapterConfig = null;
      if (chapterName) {
        const QuizConfig = (await import('./models/QuizConfig.js')).default;
        chapterConfig = await QuizConfig.findOne({ chapterName });
      }
      
      const result = battleService.submitAnswer(roomId, userId, questionIndex, answer, isCorrect, timeSpent, chapterConfig, lifelineUsed);
      
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
        // Mark completion time for this user
        result.user.completedAt = new Date();
        
        // Save individual user's battle score immediately
        const userResult = {
          userId: result.user.id,
          username: result.user.username,
          score: result.user.score,
          rank: 1, // Will be updated when battle ends
          totalTime: result.user.completedAt - battleService.getRoom(roomId).startTime,
          answers: result.user.answers,
          correctAnswers: result.user.answers.filter(a => a?.isCorrect).length,
          totalQuestions: battleService.getRoom(roomId).questions.length
        };
        
        // Save to leaderboard immediately
        await saveBattleResultsToLeaderboard({ results: [userResult] });
        
        // Mark user as completed in battle service
        battleService.markUserCompleted(roomId, userId);
        
        // Notify user and room about completion
        socket.emit('battleCompleted', {
          message: '🎉 Battle completed! Your score has been saved.',
          canLeave: true,
          finalScore: result.user.score,
          totalTime: new Date() - battleService.getRoom(roomId).startTime
        });
        
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
        
        // Send WhatsApp notification for natural battle end
        sendBattleEndNotification(roomId, battleResults);
        
        // Clear the active battle room from the API state
        try {
          // Import and clear the battle room directly
          import('./routes/battle.js').then(battleRouterModule => {
            if (battleRouterModule.clearActiveBattleRoom) {
              battleRouterModule.clearActiveBattleRoom(roomId);
              console.log(`🗑️ Auto-cleared battle room ${roomId} from API state`);
            }
          }).catch(apiError => {
            console.error('Failed to clear battle room from API:', apiError.message);
          });
        } catch (apiError) {
          console.error('Failed to clear battle room from API:', apiError.message);
        }
        
        io.to(roomId).emit('battleEnded', battleResults);
      }

      console.log(`User ${result.user.username} answered question ${questionIndex + 1} in room ${roomId}${lifelineUsed ? ` (used ${lifelineUsed})` : ''}`);
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

  // Kick user (room creator only)
  socket.on('kickUser', ({ roomId, userId, kickedBy }) => {
    try {
      const room = battleService.getRoom(roomId);
      if (!room || room.creatorId !== kickedBy) {
        socket.emit('error', { message: 'Only room creator can kick users' });
        return;
      }
      
      const user = room.users.get(userId);
      if (!user) return;
      
      // Force remove user from room completely
      room.users.delete(userId);
      
      // Disconnect the kicked user's socket
      const kickedSocket = [...io.sockets.sockets.values()].find(s => s.id === user.socketId);
      if (kickedSocket) {
        kickedSocket.leave(roomId);
        kickedSocket.disconnect(true);
      }
      
      // Notify all users about the kick
      io.to(roomId).emit('userKicked', {
        userId,
        username: user.username,
        kickedBy
      });
      
      console.log(`User ${user.username} was kicked from room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Force submission (room creator only)
  socket.on('forceSubmission', async ({ roomId, creatorId }) => {
    try {
      const room = battleService.getRoom(roomId);
      if (!room || room.creatorId !== creatorId) {
        socket.emit('error', { message: 'Only room creator can force submission' });
        return;
      }
      
      console.log(`⚡ Force submission initiated by creator for room ${roomId}`);
      
      // Force complete all users
      for (const user of room.users.values()) {
        if (!user.hasCompleted) {
          user.currentQuestion = room.questions.length;
          user.hasCompleted = true;
          user.forceSubmitted = true;
        }
      }
      
      // End the battle and get results
      const battleResults = battleService.endBattle(roomId);
      
      // Save results to leaderboard
      await saveBattleResultsToLeaderboard(battleResults);
      
      // Send WhatsApp notification
      await sendBattleEndNotification(roomId, battleResults);
      
      // Clear the active battle room from API state
      try {
        import('./routes/battle.js').then(battleRouterModule => {
          if (battleRouterModule.clearActiveBattleRoom) {
            battleRouterModule.clearActiveBattleRoom(roomId);
          }
        }).catch(apiError => {
          console.error('Failed to clear battle room from API:', apiError);
        });
      } catch (apiError) {
        console.error('Failed to clear battle room from API:', apiError);
      }
      
      // Emit battle ended to all participants
      io.to(roomId).emit('battleEnded', battleResults);
      
      console.log(`✅ Force submission completed for room ${roomId}`);
    } catch (error) {
      console.error('Error in force submission:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Leave room
  socket.on('leaveRoom', ({ roomId, userId }) => {
    try {
      const room = battleService.getRoom(roomId);
      const user = room?.users.get(userId);
      
      if (!user) {
        socket.leave(roomId);
        return;
      }
      
      // Check if user has made progress or completed the battle
      const hasProgress = user.currentQuestion > 0;
      const hasCompleted = user.hasCompleted || user.currentQuestion >= (room?.questions?.length || 0);
      
      socket.leave(roomId);
      
      if (hasProgress) {
        console.log(`📡 User ${user.username} leaving room ${roomId} - progress preserved`);
        // Keep user in room but mark as disconnected
        user.socketId = null;
        user.disconnected = true;
        user.disconnectedAt = new Date();
        
        io.to(roomId).emit('userDisconnected', {
          userId,
          username: user.username,
          hasCompleted: hasCompleted,
          hasProgress: true,
          currentQuestion: user.currentQuestion,
          score: user.score
        });
      } else {
        console.log(`🗑️ User ${user.username} leaving room ${roomId} - no progress, removing`);
        const updatedRoom = battleService.removeUserFromRoom(roomId, userId);
        if (updatedRoom) {
          io.to(roomId).emit('userLeft', {
            userId,
            username: user.username,
            totalUsers: updatedRoom.users.size,
            hasCompleted: false,
            hasProgress: false
          });
        }
      }
    } catch (error) {
      console.error('Error in leaveRoom:', error);
      socket.leave(roomId);
    }
  });

  // Spectator functionality
  socket.on('joinSpectator', ({ roomId }) => {
    console.log(`Spectator joining room ${roomId}`);
    
    try {
      const room = battleService.getRoom(roomId);
      if (room && room.isActive) {
        socket.join(roomId);
        
        // Send current room state to spectator
        socket.emit('spectatorJoined', {
          room: {
            id: roomId,
            users: Array.from(room.users.values()).map(user => ({
              id: user.id,
              username: user.username,
              isReady: user.isReady,
              currentQuestion: user.currentQuestion || 0,
              score: user.score || 0
            })),
            status: room.status,
            questions: room.questions || []
          }
        });
        
        console.log(`Spectator joined room ${roomId}`);
      } else {
        socket.emit('error', { message: 'Battle room not found or has ended' });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('leaveSpectator', ({ roomId }) => {
    console.log(`Spectator leaving room ${roomId}`);
    socket.leave(roomId);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find user in all rooms
    const userInfo = battleService.getUserBySocketId(socket.id);
    if (userInfo) {
      const { user, room } = userInfo;
      
      // Always preserve user data during disconnection
      user.socketId = null;
      user.disconnected = true;
      
      // Check if user has made progress or completed the battle
      const hasProgress = user.currentQuestion > 0 || user.hasCompleted;
      const hasCompleted = user.hasCompleted || user.currentQuestion >= (room.questions?.length || 0);
      
      if (hasProgress) {
        console.log(`📡 User ${user.username} disconnected from room ${room.id} - progress preserved (Q${user.currentQuestion}, Score: ${user.score})`);
        
        // Mark disconnect time for auto-submit
        user.disconnectedAt = new Date();
        
        // Keep user in room but mark as disconnected
        io.to(room.id).emit('userDisconnected', {
          userId: user.id,
          username: user.username,
          hasCompleted: hasCompleted,
          hasProgress: true,
          currentQuestion: user.currentQuestion,
          score: user.score,
          disconnected: true
        });
      } else {
        console.log(`⚠️ User ${user.username} disconnected from room ${room.id} - no progress, removing`);
        const updatedRoom = battleService.removeUserFromRoom(room.id, user.id);
        
        if (updatedRoom) {
          io.to(room.id).emit('userLeft', {
            userId: user.id,
            username: user.username,
            totalUsers: updatedRoom.users.size,
            hasCompleted: false,
            hasProgress: false,
            disconnected: true
          });
        }
      }
    }
  });
});

// Cleanup inactive rooms every 30 minutes
setInterval(() => {
  battleService.cleanupInactiveRooms();
}, 30 * 60 * 1000);

// Check for auto-submit every minute
setInterval(() => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Check all active battle rooms
  for (const room of battleService.battleRooms.values()) {
    if (room.status !== 'active') continue;
    
    for (const user of room.users.values()) {
      // Auto-submit users disconnected for 5+ minutes
      if (user.disconnected && user.disconnectedAt && 
          user.disconnectedAt < fiveMinutesAgo && 
          !user.autoSubmitted && !user.hasCompleted) {
        
        console.log(`⏰ Auto-submitting ${user.username} after 5min disconnect in room ${room.id}`);
        
        // Mark as completed and auto-submitted
        user.currentQuestion = room.questions.length;
        user.hasCompleted = true;
        user.autoSubmitted = true;
        
        // Check if all users are now finished
        const allFinished = Array.from(room.users.values()).every(
          u => u.currentQuestion >= room.questions.length || u.hasCompleted
        );
        
        if (allFinished) {
          console.log(`🏁 All users finished in room ${room.id} (including auto-submit)`);
          
          const battleResults = battleService.endBattle(room.id);
          
          // Save battle results to leaderboard
          saveBattleResultsToLeaderboard(battleResults);
          
          // Send WhatsApp notification
          sendBattleEndNotification(room.id, battleResults);
          
          // Clear the active battle room from API state
          try {
            import('./routes/battle.js').then(battleRouterModule => {
              if (battleRouterModule.clearActiveBattleRoom) {
                battleRouterModule.clearActiveBattleRoom(room.id);
              }
            }).catch(apiError => {
              console.error('Failed to clear battle room from API:', apiError);
            });
          } catch (apiError) {
            console.error('Failed to clear battle room from API:', apiError);
          }
          
          io.to(room.id).emit('battleEnded', battleResults);
        }
      }
    }
  }
}, 60 * 1000); // Check every minute

// Make io and battleService available to routes
app.set('io', io);
app.set('battleService', battleService);

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

console.log('Mounting image upload router...');
app.use('/api/upload-image', uploadImageRouter);
console.log('Mounting vision router...');
app.use('/api/vision', visionRouter);
console.log('Mounting image generation router...');
app.use('/api', imageGenerationRouter);
console.log('Mounting theme router...');
app.use('/api/theme', themeRouter);
console.log('Mounting WhatsApp router...');
app.use('/api/whatsapp', whatsappRouter);
console.log('Mounting events router...');
app.use('/api/events', (await import('./routes/events.js')).default);
console.log('Mounting user router...');
app.use('/api/user', userRouter);
console.log('Mounting maintenance router...');
app.use('/api/superadmin/maintenance', maintenanceRouter);
console.log('Mounting share router...');
app.use('/api/share', shareRouter);
console.log('Mounting written exam router...');
app.use('/api/written-exam', writtenExamRouter);
console.log('Mounting examiner router...');
app.use('/api/examiner', examinerRouter);
console.log('Mounting messenger router...');
app.use('/api/messenger', messengerRouter);
console.log('Mounting notepad router...');
app.use('/api/notepad', notepadRouter);
console.log('Mounting progress router...');
app.use('/api/progress', progressRouter);
console.log('Mounting secret chat router...');
app.use('/api/secret-chat', secretChatRouter);
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

// Exam management endpoints
app.get('/api/exams', async (req, res) => {
  try {
    const exams = await Exam.find({ isActive: true }).sort({ examDate: 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exams', async (req, res) => {
  try {
    const { examName, examDate, createdBy } = req.body;
    const exam = new Exam({ examName, examDate, createdBy });
    await exam.save();
    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/exams/:id', async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily calendar scheduler endpoints
app.get('/api/calendar/status', (req, res) => {
  const status = dailyCalendarScheduler.getStatus();
  res.json(status);
});

app.post('/api/calendar/trigger', async (req, res) => {
  try {
    await dailyCalendarScheduler.triggerManually();
    res.json({ message: 'Daily calendar update triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Battle reminder endpoints
app.get('/api/battle-reminder/status', (req, res) => {
  const status = battleReminderService.getStatus();
  res.json(status);
});

app.post('/api/battle-reminder/trigger', async (req, res) => {
  try {
    await battleReminderService.triggerManually();
    res.json({ message: 'Battle reminder triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/battle-reminder/time', (req, res) => {
  try {
    const { time } = req.body;
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM' });
    }
    battleReminderService.updateReminderTime(time);
    res.json({ message: 'Reminder time updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example route
app.get('/', (req, res) => {
  res.send('Express + MongoDB Atlas backend is running!');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));