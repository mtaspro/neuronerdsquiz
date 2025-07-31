import { io } from 'socket.io-client';

// Socket configuration
const SOCKET_CONFIG = {
  // Use environment variable or fallback to API URL or localhost
  url: import.meta.env.VITE_SOCKET_SERVER_URL || 
       import.meta.env.VITE_API_URL || 
       'http://localhost:5000',
  
  options: {
    // Reconnection settings
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    
    // Connection timeout
    timeout: 10000,
    
    // Transport options
    transports: ['websocket', 'polling'],
    
    // CORS settings for production
    withCredentials: false,
    
    // Additional options for better reliability
    forceNew: false,
    autoConnect: true,
  }
};

// Create socket instance
let socket = null;

export const createSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  console.log('🔌 Connecting to Socket.IO server:', SOCKET_CONFIG.url);
  
  socket = io(SOCKET_CONFIG.url, SOCKET_CONFIG.options);
  
  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server');
    console.log('Socket ID:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from Socket.IO server:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('🔥 Socket connection error:', error);
    console.error('Attempted URL:', SOCKET_CONFIG.url);
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Reconnected to Socket.IO server (attempt:', attemptNumber, ')');
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('🔄❌ Reconnection failed:', error);
  });
  
  socket.on('reconnect_failed', () => {
    console.error('🔄💀 Reconnection failed permanently');
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return createSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌❌ Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

// Battle room specific socket helpers
export const battleSocketHelpers = {
  // Join a battle room
  joinRoom: (roomId, userId, username) => {
    const socketInstance = getSocket();
    socketInstance.emit('joinBattleRoom', {
      roomId,
      userId,
      username
    });
  },
  
  // Leave a battle room
  leaveRoom: (roomId, userId) => {
    const socketInstance = getSocket();
    socketInstance.emit('leaveRoom', {
      roomId,
      userId
    });
  },
  
  // Set ready status
  setReady: (roomId, userId, isReady) => {
    const socketInstance = getSocket();
    socketInstance.emit('setReady', {
      roomId,
      userId,
      isReady
    });
  },
  
  // Start battle
  startBattle: (roomId, questions) => {
    const socketInstance = getSocket();
    socketInstance.emit('startBattle', {
      roomId,
      questions
    });
  },
  
  // Submit answer
  submitAnswer: (roomId, userId, questionIndex, answer, isCorrect, timeSpent) => {
    const socketInstance = getSocket();
    socketInstance.emit('answerQuestion', {
      roomId,
      userId,
      questionIndex,
      answer,
      isCorrect,
      timeSpent
    });
  }
};

// Socket event listeners helper
export const addSocketListeners = (eventHandlers) => {
  const socketInstance = getSocket();
  
  Object.entries(eventHandlers).forEach(([event, handler]) => {
    socketInstance.on(event, handler);
  });
  
  // Return cleanup function
  return () => {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketInstance.off(event, handler);
    });
  };
};

// Debug helper
export const getSocketInfo = () => {
  return {
    url: SOCKET_CONFIG.url,
    connected: socket?.connected || false,
    id: socket?.id || null,
    transport: socket?.io?.engine?.transport?.name || null,
    environment: import.meta.env.MODE,
    config: SOCKET_CONFIG
  };
};

export default {
  createSocket,
  getSocket,
  disconnectSocket,
  battleSocketHelpers,
  addSocketListeners,
  getSocketInfo
};