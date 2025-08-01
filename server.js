import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import leaderboardRouter from './routes/leaderboard.js';
import authRouter from './routes/auth.js';
import quizRouter from './routes/quiz.js';
import adminRouter from './routes/admin.js';
import BattleService from './services/battleService.js';
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

// Add dynamic Vercel domain support
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any Vercel app domain
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow localhost with any port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: false
};

console.log('🌐 CORS configuration:', {
  allowedOrigins,
  dynamicVercelSupport: true,
  localhostSupport: true
});

const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json());
app.use(cors(corsOptions));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected!'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Battle service instance
const battleService = new BattleService();

// Function to save battle results to leaderboard
async function saveBattleResultsToLeaderboard(battleResults) {
  try {
    console.log('💾 Saving battle results to leaderboard...');
    
    for (const result of battleResults.results) {
      try {
        // Find existing user score or create new one
        const existingScore = await UserScore.findOne({ username: result.username });
        
        if (existingScore) {
          // Update if new score is higher
          if (result.score > existingScore.score) {
            existingScore.score = result.score;
            await existingScore.save();
            console.log(`📈 Updated ${result.username} score: ${result.score}`);
          }
        } else {
          // Create new leaderboard entry
          const newScore = new UserScore({
            username: result.username,
            score: result.score,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.username)}&background=random`
          });
          await newScore.save();
          console.log(`🆕 Added ${result.username} to leaderboard: ${result.score}`);
        }
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
        
        // Save battle results to leaderboard
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

// Mount the routers with /api prefix
console.log('Mounting leaderboard router...');
app.use('/api', leaderboardRouter);
console.log('Mounting auth router...');
app.use('/api/auth', authRouter);
console.log('Mounting quiz router...');
app.use('/api/quizzes', quizRouter);
console.log('Mounting admin router...');
app.use('/api/admin', adminRouter);
console.log('All routers mounted successfully');

// Test route for API connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
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