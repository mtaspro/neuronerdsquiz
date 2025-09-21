// Battle Service - Manages real-time quiz battles
class BattleService {
  constructor() {
    this.battleRooms = new Map();
    this.maxUsersPerRoom = 30;
    this.minUsersToStart = 2;
  }

  // Create a new battle room
  createRoom(roomId) {
    const room = {
      id: roomId,
      users: new Map(),
      status: 'waiting', // waiting, active, finished
      currentQuestion: 0,
      questions: [],
      startTime: null,
      endTime: null,
      maxUsers: this.maxUsersPerRoom,
      createdAt: new Date(),
      isActive: true, // Track if room is still accepting new users
      creatorId: null, // Track original creator
      inappropriateReports: new Map() // Track inappropriate question reports by questionIndex
    };
    
    this.battleRooms.set(roomId, room);
    return room;
  }

  // Get room by ID
  getRoom(roomId) {
    return this.battleRooms.get(roomId);
  }

  // Add user to room
  addUserToRoom(roomId, userId, username, socketId) {
    let room = this.getRoom(roomId);
    
    if (!room) {
      room = this.createRoom(roomId);
    }

    // Check if room is still active for new users
    if (!room.isActive) {
      throw new Error('❌ This battle room is no longer accepting new players.');
    }

    // Check if room is full
    if (room.users.size >= room.maxUsers) {
      throw new Error('Room is full');
    }

    // Check if battle is already in progress - allow rejoin if user was previously in the room
    if (room.status === 'active') {
      const existingUser = room.users.get(userId);
      if (!existingUser) {
        throw new Error('❌ This battle is already in progress. Please join a new one.');
      }
      // User is rejoining - update their socket ID
      existingUser.socketId = socketId;
      existingUser.disconnected = false;
      console.log(`✅ User ${username} rejoined active battle in room ${roomId}`);
      return room;
    }
    
    if (room.status === 'finished') {
      throw new Error('❌ This battle has ended. Please join a new one.');
    }

    // Set creator on first join
    if (!room.creatorId && room.users.size === 0) {
      room.creatorId = userId;
    }
    
    // Preserve user data on rejoin
    const existingUser = room.users.get(userId);
    
    if (existingUser) {
      // Update socket ID for existing user
      existingUser.socketId = socketId;
      existingUser.disconnected = false;
    } else {
      // Add new user to room
      room.users.set(userId, {
        id: userId,
        username,
        socketId,
        currentQuestion: 0,
        score: 0,
        answers: [],
        isReady: false,
        joinedAt: new Date(),
        disconnected: false
      });
    }

    return room;
  }

  // Remove user from room
  removeUserFromRoom(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const user = room.users.get(userId);
    if (user) {
      room.users.delete(userId);
      
      // If no users left, delete the room
      if (room.users.size === 0) {
        this.battleRooms.delete(roomId);
        return null;
      }
    }

    return room;
  }

  // Start battle
  startBattle(roomId, questions, creatorUserId) {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is the room creator
    if (room.creatorId !== creatorUserId) {
      throw new Error('Only room creator can start the battle');
    }

    // Check if minimum users requirement is met
    if (room.users.size < this.minUsersToStart) {
      throw new Error(`Need at least ${this.minUsersToStart} players to start`);
    }

    room.status = 'active';
    room.questions = questions;
    room.startTime = new Date();
    room.currentQuestion = 0;

    // Reset all users' progress
    room.users.forEach(user => {
      user.currentQuestion = 0;
      user.score = 0;
      user.answers = [];
    });

    return room;
  }

  // Submit answer
  submitAnswer(roomId, userId, questionIndex, answer, isCorrect, timeSpent, chapterConfig = null, lifelineUsed = null) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== 'active') {
      throw new Error('Battle not active');
    }

    const user = room.users.get(userId);
    if (!user) {
      throw new Error('User not found in room');
    }

    // Record the answer
    user.answers[questionIndex] = {
      answer,
      isCorrect,
      timeSpent,
      lifelineUsed,
      timestamp: new Date()
    };

    // Update score with lifeline and negative scoring support
    if (isCorrect) {
      // Base scoring: 2 points + time bonus
      let baseScore = 2;
      const timeBonus = Math.max(0, 1 - Math.floor(timeSpent / 10000)); // Max 1 point for very fast answers
      
      // Apply lifeline penalty for help tool
      if (lifelineUsed === 'help') {
        baseScore = Math.floor(baseScore * 0.5); // 50% penalty by default
      }
      
      user.score += baseScore + timeBonus;
    } else if (chapterConfig?.negativeScoring) {
      // Apply negative score for wrong answers if enabled
      user.score += chapterConfig.negativeScore || -1;
      // Ensure score doesn't go below 0
      user.score = Math.max(0, user.score);
    }

    // Move to next question
    user.currentQuestion = questionIndex + 1;

    return {
      user,
      hasFinished: user.currentQuestion >= room.questions.length,
      allFinished: this.checkAllUsersFinished(room)
    };
  }

  // Check if all users have finished
  checkAllUsersFinished(room) {
    return Array.from(room.users.values()).every(
      user => user.currentQuestion >= room.questions.length
    );
  }

  // Report inappropriate question
  reportInappropriateQuestion(roomId, userId, questionIndex, questionId) {
    const room = this.getRoom(roomId);
    if (!room || room.status !== 'active') {
      throw new Error('Battle not active');
    }

    const user = room.users.get(userId);
    if (!user) {
      throw new Error('User not found in room');
    }

    // Initialize reports for this question if not exists
    if (!room.inappropriateReports.has(questionIndex)) {
      room.inappropriateReports.set(questionIndex, new Set());
    }

    // Add user's report
    room.inappropriateReports.get(questionIndex).add(userId);

    return {
      username: user.username,
      questionIndex,
      totalReports: room.inappropriateReports.get(questionIndex).size,
      totalUsers: room.users.size
    };
  }

  // Check if question is inappropriate by majority
  isQuestionInappropriate(room, questionIndex) {
    const reports = room.inappropriateReports.get(questionIndex);
    if (!reports) return false;
    
    const totalUsers = room.users.size;
    const reportCount = reports.size;
    
    // Majority rule: more than 50% of users reported it
    return reportCount > Math.floor(totalUsers / 2);
  }

  // End battle and calculate results
  endBattle(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.status = 'finished';
    room.endTime = new Date();
    room.isActive = false; // Mark room as inactive for new users
    
    // Find inappropriate questions by majority vote
    const inappropriateQuestions = [];
    for (const [questionIndex, reports] of room.inappropriateReports.entries()) {
      if (this.isQuestionInappropriate(room, questionIndex)) {
        inappropriateQuestions.push(questionIndex);
      }
    }
    
    // Calculate final results with inappropriate question bonuses
    const results = Array.from(room.users.values())
      .map((user, index) => {
        let bonusScore = 0;
        
        // Award bonus points for inappropriate questions reported by this user
        inappropriateQuestions.forEach(qIndex => {
          const userReported = room.inappropriateReports.get(qIndex)?.has(user.id);
          if (userReported) {
            bonusScore += 2; // 2 points bonus for correctly identifying inappropriate question
          }
        });
        
        return {
          userId: user.id,
          username: user.username,
          score: user.score + bonusScore,
          rank: 0, // Will be set after sorting
          totalTime: room.endTime - room.startTime,
          answers: user.answers,
          correctAnswers: user.answers.filter(a => a?.isCorrect).length,
          totalQuestions: room.questions.length,
          inappropriateBonusScore: bonusScore
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((result, index) => ({ ...result, rank: index + 1 }));

    // Schedule room cleanup after 10 minutes
    setTimeout(() => {
      this.battleRooms.delete(roomId);
      console.log(`🗑️ Cleaned up finished battle room: ${roomId}`);
    }, 10 * 60 * 1000); // 10 minutes

    return {
      results,
      questions: room.questions,
      startTime: room.startTime,
      endTime: room.endTime,
      inappropriateQuestions: inappropriateQuestions.map(qIndex => ({
        questionIndex: qIndex,
        question: room.questions[qIndex],
        reportCount: room.inappropriateReports.get(qIndex)?.size || 0
      }))
    };
  }

  // Set user ready status
  setUserReady(roomId, userId, isReady) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const user = room.users.get(userId);
    if (user) {
      user.isReady = isReady;
      return user;
    }

    return null;
  }

  // Mark user as completed (for safe leaving)
  markUserCompleted(roomId, userId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const user = room.users.get(userId);
    if (user) {
      user.hasCompleted = true;
      user.completedAt = new Date();
      console.log(`✅ Marked user ${user.username} as completed in room ${roomId}`);
      return user;
    }

    return null;
  }

  // Get room status for API
  getRoomStatus(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return null;

    return {
      id: room.id,
      userCount: room.users.size,
      status: room.status,
      isActive: room.isActive,
      maxUsers: room.maxUsers,
      startTime: room.startTime,
      endTime: room.endTime,
      creatorId: room.creatorId,
      users: Array.from(room.users.values()).map(user => ({
        id: user.id,
        username: user.username,
        isReady: user.isReady,
        currentQuestion: user.currentQuestion,
        score: user.score
      }))
    };
  }

  // Get all rooms info
  getAllRoomsInfo() {
    return Array.from(this.battleRooms.values()).map(room => ({
      id: room.id,
      userCount: room.users.size,
      status: room.status,
      isActive: room.isActive,
      maxUsers: room.maxUsers,
      createdAt: room.createdAt
    }));
  }

  // Clean up inactive rooms (older than 1 hour)
  cleanupInactiveRooms() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [roomId, room] of this.battleRooms.entries()) {
      // Clean up waiting rooms older than 1 hour or finished rooms older than 10 minutes
      const shouldCleanup = 
        (room.status === 'waiting' && room.createdAt < oneHourAgo) ||
        (room.status === 'finished' && room.endTime && room.endTime < new Date(Date.now() - 10 * 60 * 1000));
      
      if (shouldCleanup) {
        this.battleRooms.delete(roomId);
        console.log(`🗑️ Cleaned up inactive room: ${roomId} (status: ${room.status})`);
      }
    }
  }

  // Get user by socket ID
  getUserBySocketId(socketId) {
    for (const room of this.battleRooms.values()) {
      for (const user of room.users.values()) {
        if (user.socketId === socketId) {
          return { user, room };
        }
      }
    }
    return null;
  }
}

export default BattleService;